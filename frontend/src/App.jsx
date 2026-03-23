import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');

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
    <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #2c3e50', marginBottom: '24px', paddingBottom: '12px' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>📄 Paper Analyzer</h1>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
          App elaborada por el <strong>Dr. Mario A. Ramírez Barajas</strong> para: <strong>Mtro. Pedro Santiago Sánchez</strong>
        </p>
      </div>

      {/* Upload section */}
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

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '12px', borderTop: '1px solid #dee2e6', textAlign: 'center', color: '#adb5bd', fontSize: '12px' }}>
        Paper Analyzer · Dr. Mario A. Ramírez Barajas · {new Date().getFullYear()}
      </div>
    </div>
  );
}
