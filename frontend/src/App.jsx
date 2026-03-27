import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);

  const uploadFiles = async () => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(file => formData.append('papers', file));

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`Archivos en cola: ${response.data.jobs.length}`);
      setJobs(response.data.jobs);
    } catch (error) {
      setMessage(error.response?.data?.error || error.message);
    }
  };

  const refreshJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs`);
      setJobs(response.data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_URL}/api/jobs/${jobId}`);
      setMessage(`Paper eliminado (job ${jobId})`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (error) {
      setMessage(error.response?.data?.error || error.message);
    }
  };

  const exportJob = (jobId) => {
    window.open(`${API_URL}/api/export/${jobId}`, '_blank');
  };

  const stateLabel = (state) => {
    const labels = {
      waiting: '⏳ En espera',
      active: '🔄 Procesando',
      completed: '✅ Completado',
      failed: '❌ Fallido'
    };
    return labels[state] || state;
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif', maxWidth: '100%', margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Welcome Banner */}
      {showWelcome && (
        <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff', padding: '32px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 'bold' }}>🌊 Auditor de Seguridad Ambiental</h1>
              <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#e0e0e0' }}>Cuenca de Tula • Sistema de Análisis Normativo y Académico</p>
              
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>📋 Instrucciones:</p>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li><strong>Carga de Archivos:</strong> Sube hasta 5 documentos (Artículos, NOMs, Leyes o Informes). El sistema generará la ficha técnica en APA 7.ª edición.</li>
                  <li><strong>Consulta Rápida:</strong> Chatear con los documentos para resolver dudas sobre contaminantes, límites y normativa.</li>
                  <li><strong>Informe Maestro:</strong> Escribe <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>/Informe_Profundo</code> para generar un dictamen de 2,500 palabras + Matriz de Intersección.</li>
                  <li><strong>Exportación:</strong> Una vez generado, usa el botón "Exportar a PDF" para obtener el documento oficial.</li>
                </ul>
              </div>
              
              <p style={{ margin: '0', fontSize: '12px', color: '#b0b0b0' }}>⚠️ Si un documento no tiene autor personal, el sistema aplicará autoría corporativa/institucional automáticamente.</p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', borderBottom: '2px solid #2c3e50', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto 24px' }}>
        <h1 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '22px' }}>📄 Paper Analyzer</h1>
        <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
          App desarrollada por el <strong>Dr. Mario A. Ramírez Barajas</strong> para: <strong>Mtro. Pedro Santiago Sánchez</strong>
        </p>
      </div>

      {/* Upload section */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ marginTop: 0, fontSize: '16px', color: '#495057' }}>Cargar Papers</h2>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Acepta .pdf, .docx y .txt — hasta 10 archivos a la vez.</p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={e => setFiles(Array.from(e.target.files))}
            style={{ marginBottom: '12px', display: 'block' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={uploadFiles}
              disabled={!files.length}
              style={{
                padding: '8px 18px', background: files.length ? '#2c3e50' : '#adb5bd',
                color: '#fff', border: 'none', borderRadius: '5px', cursor: files.length ? 'pointer' : 'not-allowed'
              }}>
              Subir y analizar
            </button>
            <button
              onClick={refreshJobs}
              style={{ padding: '8px 18px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              🔄 Actualizar estado
            </button>
          </div>
          {message && <p style={{ marginTop: '12px', color: '#495057', fontSize: '14px' }}>{message}</p>}
        </div>

        {/* Jobs list */}
        <h2 style={{ fontSize: '16px', color: '#495057', marginBottom: '12px' }}>Papers en cola ({jobs.length})</h2>
        {jobs.length === 0
          ? <p style={{ color: '#adb5bd', fontStyle: 'italic' }}>No hay papers cargados aún.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#2c3e50', color: '#fff' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Archivo</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={job.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px', color: '#888', fontFamily: 'monospace' }}>{job.id}</td>
                    <td style={{ padding: '10px' }}>{job.data?.originalName || job.file || '—'}</td>
                    <td style={{ padding: '10px' }}>{stateLabel(job.state)}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {job.state === 'completed' && (
                          <button
                            onClick={() => exportJob(job.id)}
                            style={{ padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            ⬇ Exportar
                          </button>
                        )}
                        <button
                          onClick={() => deleteJob(job.id)}
                          style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          🗑 Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {/* Footer */}
      <div style={{ maxWidth: '900px', margin: '40px auto 0', paddingTop: '12px', borderTop: '1px solid #dee2e6', textAlign: 'center', color: '#adb5bd', fontSize: '12px' }}>
        Auditor de Seguridad Ambiental • Cuenca de Tula • Dr. Mario A. Ramírez Barajas • {new Date().getFullYear()}
      </div>
    </div>
  );
}
