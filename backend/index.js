const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const analysisQueue = new Queue('analysis', { connection });

const ANALYSIS_STORAGE = path.join(__dirname, 'analysis');
if (!fs.existsSync(ANALYSIS_STORAGE)) fs.mkdirSync(ANALYSIS_STORAGE, { recursive: true });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper de timeout para Promesas para evitar que el proceso se quede "pasmado"
function withTimeout(promise, ms, description = 'Operación') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${description} superó el tiempo límite de ${ms/1000}s`)), ms))
  ]);
}

// ── Extracción de texto según tipo de archivo ──────────────────────────────
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  const extractPromise = async () => {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      
      // Si a pesar de ser PDF no tiene texto (ej. escaneado), se devolverá vacío 
      // y lanzará error al validar longitud en el worker.
      return data.text || '';
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      console.log(`[OCR] Iniciando reconocimiento de imagen: ${originalName}...`);
      const Tesseract = require('tesseract.js');
      // We use spa+eng to handle both languages common in analysis.
      const result = await Tesseract.recognize(filePath, 'spa+eng');
      return result.data.text + '\n\n';
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else {
      return fs.readFileSync(filePath, 'utf-8');
    }
  };

  try {
    // OCR can be slow, 180 seconds timeout
    return await withTimeout(extractPromise(), 180000, 'Extracción de texto del archivo (OCR)');
  } catch (err) {
    console.error('Error extrayendo texto:', err.message);
    throw new Error(`Fallo en lectura: ${err.message}`);
  }
}

// ── Análisis con Groq ──────────────────────────────────────────────────────
async function analyzeWithGroq(text, originalName) {
  const snippet = text.slice(0, 12000);

  const prompt = `Eres un experto en análisis de papers académicos. Analiza el siguiente texto y extrae la información en formato JSON estricto. Si algún campo no está disponible, usa null.

Texto del paper:
---
${snippet}
---

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "title": "Título completo del paper",
  "authors": ["Autor 1", "Autor 2"],
  "year": 2024,
  "journal": "Nombre de la revista o conferencia",
  "keywords": ["palabra1", "palabra2"],
  "citationsStyle": "APA o IEEE o Vancouver o Chicago",
  "summary": "Resumen ejecutivo del paper en 3-5 oraciones",
  "objective": "Objetivo principal del estudio",
  "theory": "Marco teórico o teorías base identificadas",
  "methodology": "Metodología o diseño de investigación utilizado",
  "findings": "Principales hallazgos y resultados",
  "conclusions": "Conclusiones del paper",
  "limitations": "Limitaciones del estudio mencionadas por los autores",
  "references": [
    { "authors": "Apellido, N.", "year": 2020, "title": "Título ref", "source": "Revista/Libro" }
  ]
}`;

  const groqPromise = groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 2048
  });

  const response = await withTimeout(groqPromise, 60000, 'Análisis de Inteligencia Artificial (Groq)');

  const raw = response.choices[0]?.message?.content || '{}';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Groq no devolvió JSON válido');
  return JSON.parse(match[0]);
}

// ── Rutas API ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/upload', upload.array('papers', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un archivo' });
  }
  const jobs = [];
  for (const file of req.files) {
    const job = await analysisQueue.add('analyze', {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path
    });
    jobs.push({ id: job.id, file: file.originalname });
  }
  res.json({ message: 'Archivos agregados a cola', jobs });
});

app.get('/api/jobs', async (req, res) => {
  const states = ['waiting', 'active', 'completed', 'failed'];
  const jobsAll = await analysisQueue.getJobs(states);
  const jobs = await Promise.all(jobsAll.map(async job => ({
    id: job.id,
    state: await job.getState(),
    data: job.data,
    returnvalue: job.returnvalue
  })));
  res.json(jobs);
});

app.get('/api/analysis/:jobId', async (req, res) => {
  const job = await analysisQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json({ id: job.id, state: await job.getState(), data: job.data, result: job.returnvalue });
});

app.get('/api/export/:jobId', async (req, res) => {
  const resultFile = path.join(ANALYSIS_STORAGE, `result-${req.params.jobId}.xlsx`);
  if (!fs.existsSync(resultFile)) return res.status(404).json({ error: 'Archivo no disponible' });
  res.download(resultFile);
});

app.delete('/api/jobs/:jobId', async (req, res) => {
  const job = await analysisQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  if (job.data?.path && fs.existsSync(job.data.path)) fs.unlinkSync(job.data.path);
  const resultFile = path.join(ANALYSIS_STORAGE, `result-${job.id}.xlsx`);
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  await job.remove();
  res.json({ message: `Job ${req.params.jobId} eliminado correctamente` });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));

// ── Worker ─────────────────────────────────────────────────────────────────
const worker = new Worker('analysis', async job => {
  console.log(`Procesando: ${job.data.originalName}`);

  const rawText = await extractText(job.data.path, job.data.originalName);
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('No se pudo extraer texto suficiente del archivo o el archivo está vacío');
  }

  let metadata;
  try {
    metadata = await analyzeWithGroq(rawText, job.data.originalName);
  } catch (err) {
    console.error('Error Groq u Operación:', err.message);
    throw new Error(`Procesamiento falló: ${err.message}`);
  }

  const wb = xlsx.utils.book_new();

  const wsMeta = xlsx.utils.json_to_sheet([{
    'Título': metadata.title || job.data.originalName,
    'Autores': (metadata.authors || []).join('; '),
    'Año': metadata.year || '',
    'Revista / Conferencia': metadata.journal || '',
    'Palabras clave': (metadata.keywords || []).join(', '),
    'Estilo de citas': metadata.citationsStyle || ''
  }]);

  const wsSections = xlsx.utils.json_to_sheet([{
    'Resumen': metadata.summary || '',
    'Objetivo': metadata.objective || '',
    'Marco teórico': metadata.theory || '',
    'Metodología': metadata.methodology || '',
    'Hallazgos': metadata.findings || '',
    'Conclusiones': metadata.conclusions || '',
    'Limitaciones': metadata.limitations || ''
  }]);

  const refs = (metadata.references || []).map(r => ({
    'Autores': r.authors || '',
    'Año': r.year || '',
    'Título': r.title || '',
    'Fuente': r.source || ''
  }));
  const wsRefs = xlsx.utils.json_to_sheet(
    refs.length ? refs : [{ Info: 'Sin referencias identificadas' }]
  );

  xlsx.utils.book_append_sheet(wb, wsMeta, 'Metadata');
  xlsx.utils.book_append_sheet(wb, wsSections, 'Análisis');
  xlsx.utils.book_append_sheet(wb, wsRefs, 'Referencias');

  const outputPath = path.join(ANALYSIS_STORAGE, `result-${job.id}.xlsx`);
  xlsx.writeFile(wb, outputPath);

  console.log(`✅ Completado: ${job.data.originalName}`);
  return { ...metadata, outputPath, rawTextSnippet: rawText.slice(0, 300) };

}, { connection, concurrency: 2 }); // Allow processing up to 2 jobs at a time

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} falló:`, err.message);
});

worker.on('error', err => {
  console.error('⚠️ Error crítico en el Worker de BullMQ:', err);
});
