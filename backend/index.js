const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl);
const analysisQueue = new Queue('analysis', { connection });

const ANALYSIS_STORAGE = path.join(__dirname, 'analysis');
if (!fs.existsSync(ANALYSIS_STORAGE)) fs.mkdirSync(ANALYSIS_STORAGE, { recursive: true });

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

  // Eliminar archivo subido
  if (job.data?.path && fs.existsSync(job.data.path)) {
    fs.unlinkSync(job.data.path);
  }

  // Eliminar resultado xlsx si existe
  const resultFile = path.join(ANALYSIS_STORAGE, `result-${job.id}.xlsx`);
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);

  await job.remove();
  res.json({ message: `Job ${req.params.jobId} eliminado correctamente` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));

new Worker('analysis', async job => {
  let rawText;
  try {
    rawText = fs.readFileSync(job.data.path, 'utf-8');
  } catch {
    rawText = 'Texto no extraido (archivo binario).';
  }

  const metadata = {
    title: job.data.originalName,
    authors: ['Autor no identificado'],
    year: new Date().getFullYear(),
    summary: `Resumen de ejemplo para ${job.data.originalName}`,
    theory: 'Teoría identificada (demo).',
    methodology: 'Metodología identificada (demo).',
    findings: 'Hallazgos extraídos (demo).',
    citationsStyle: 'APA',
    references: []
  };

  const wb = xlsx.utils.book_new();
  const wsMeta = xlsx.utils.json_to_sheet([{
    title: metadata.title,
    authors: metadata.authors.join('; '),
    year: metadata.year,
    citationsStyle: metadata.citationsStyle,
    summary: metadata.summary
  }]);

  const wsSections = xlsx.utils.json_to_sheet([{
    theory: metadata.theory,
    methodology: metadata.methodology,
    findings: metadata.findings
  }]);

  const wsRefs = xlsx.utils.json_to_sheet(metadata.references);

  xlsx.utils.book_append_sheet(wb, wsMeta, 'metadata');
  xlsx.utils.book_append_sheet(wb, wsSections, 'sections');
  xlsx.utils.book_append_sheet(wb, wsRefs, 'references');

  const outputPath = path.join(ANALYSIS_STORAGE, `result-${job.id}.xlsx`);
  xlsx.writeFile(wb, outputPath);

  return { ...metadata, outputPath, rawTextSnippet: rawText.slice(0, 300) };
}, { connection });
