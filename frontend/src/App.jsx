import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STATUS_CONFIG = {
  waiting:   { label: 'En espera',   color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  active:    { label: 'Procesando',  color: '#3b82f6', bg: '#dbeafe', dot: '#3b82f6' },
  completed: { label: 'Completado',  color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
  failed:    { label: 'Error',       color: '#ef4444', bg: '#fee2e2', dot: '#ef4444' },
};

export default function App() {
  const [files, setFiles]       = useState([]);
  const [jobs, setJobs]         = useState([]);
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f =>
      ['.pdf','.docx','.txt'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(valid);
  };

  const uploadFiles = async () => {
    if (!files.length) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('papers', f));
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData);
      setMessage(`✅ ${res.data.jobs.length} archivo(s) en cola para análisis.`);
      setJobs(prev => [...res.data.jobs, ...prev]);
      setFiles([]);
    } catch (e) {
      setMessage(`❌ ${e.response?.data?.error || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      setJobs(res.data);
    } catch (e) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_URL}/api/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e) {
      setMessage(`❌ ${e.response?.data?.error || e.message}`);
    }
  };

  const s = STATUS_CONFIG;

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      <header style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', paddingBottom:32, boxShadow:'0 4px 24px rgba(0,0,0,0.18)' }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:42 }}>📄</div>
            <div>
              <h1 style={{ margin:0, color:'#fff', fontSize:28, fontWeight:700, letterSpacing:'-0.5px' }}>Paper Analyzer</h1>
              <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.75)', fontSize:13 }}>
                App elaborada por el <strong style={{color:'#93c5fd'}}>Dr. Mario A. Ramírez Barajas</strong> para: <strong style={{color:'#93c5fd'}}>Mtro. Pedro Santiago Sánchez</strong>
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:24, flexWrap:'wrap' }}>
            {[
              { label:'Total',       value: jobs.length,                                              color:'#60a5fa' },
              { label:'Completados', value: jobs.filter(j=>j.state==='completed').length,              color:'#34d399' },
              { label:'En proceso',  value: jobs.filter(j=>['waiting','active'].includes(j.state)).length, color:'#fbbf24' },
              { label:'Errores',     value: jobs.filter(j=>j.state==='failed').length,                color:'#f87171' },
            ].map(stat => (
              <div key={stat.label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'10px 20px', backdropFilter:'blur(8px)' }}>
                <div style={{ color:stat.color, fontSize:22, fontWeight:700 }}>{stat.value}</div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth:860, margin:'0 auto', padding:'28px 24px' }}>

        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:28, marginBottom:24 }}>
          <h2 style={{ margin:'0 0 16px', fontSize:16, fontWeight:600, color:'#1e3a5f' }}>Cargar Papers</h2>
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            style={{ border:`2px dashed ${dragging ? '#2563eb' : '#cbd5e1'}`, borderRadius:12, padding:'32px 20px',
              textAlign:'center', cursor:'pointer', background: dragging ? '#eff6ff':'#f8fafc', transition:'all .2s', marginBottom:16 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>⬆️</div>
            <p style={{ margin:0, color:'#475569', fontWeight:500 }}>
              {files.length ? `${files.length} archivo(s) seleccionado(s)` : 'Arrastra archivos aquí o haz clic para seleccionar'}
            </p>
            <p style={{ margin:'6px 0 0', color:'#94a3b8', fontSize:13 }}>PDF, DOCX o TXT — máximo 10 archivos</p>
            {files.length > 0 && (
              <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
                {files.map(f => (
                  <span key={f.name} style={{ background:'#dbeafe', color:'#1d4ed8', fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:500 }}>
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display:'none' }}
            onChange={e => handleFiles(e.target.files)} />

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={uploadFiles} disabled={!files.length || loading}
              style={{ padding:'10px 24px', background: files.length && !loading ? 'linear-gradient(135deg,#1e3a5f,#2563eb)':'#cbd5e1',
                color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:14,
                cursor: files.length && !loading ? 'pointer':'not-allowed',
                boxShadow: files.length && !loading ? '0 4px 12px rgba(37,99,235,0.35)':'none', transition:'all .2s' }}>
              {loading ? '⏳ Procesando...' : '🚀 Subir y analizar'}
            </button>
            <button onClick={refreshJobs} disabled={loading}
              style={{ padding:'10px 20px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0',
                borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' }}>
              🔄 Actualizar estado
            </button>
          </div>

          {message && (
            <div style={{ marginTop:14, padding:'10px 16px',
              background: message.startsWith('❌') ? '#fef2f2':'#f0fdf4',
              border:`1px solid ${message.startsWith('❌') ? '#fca5a5':'#86efac'}`,
              borderRadius:8, color: message.startsWith('❌') ? '#dc2626':'#16a34a', fontSize:14 }}>
              {message}
            </div>
          )}
        </div>

        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:600, color:'#1e3a5f' }}>
              Papers en cola <span style={{ color:'#94a3b8', fontWeight:400 }}>({jobs.length})</span>
            </h2>
          </div>
          {jobs.length === 0 ? (
            <div style={{ padding:'48px 24px', textAlign:'center', color:'#94a3b8' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <p style={{ margin:0, fontSize:15 }}>No hay papers cargados aún.</p>
              <p style={{ margin:'6px 0 0', fontSize:13 }}>Sube un PDF, DOCX o TXT para comenzar el análisis.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Archivo','Estado','Acciones'].map(h => (
                      <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:12, fontWeight:600,
                        color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', borderBottom:'1px solid #f1f5f9' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const cfg = s[job.state] || s.waiting;
                    return (
                      <tr key={job.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                        <td style={{ padding:'14px 20px' }}>
                          <div style={{ fontWeight:500, color:'#1e293b', fontSize:14 }}>
                            {job.data?.originalName || job.file || '—'}
                          </div>
                          <div style={{ color:'#94a3b8', fontSize:11, marginTop:2, fontFamily:'monospace' }}>ID: {job.id}</div>
                        </td>
                        <td style={{ padding:'14px 20px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
                            background:cfg.bg, color:cfg.color, borderRadius:20, fontSize:13, fontWeight:500 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding:'14px 20px' }}>
                          <div style={{ display:'flex', gap:8 }}>
                            {job.state === 'completed' && (
                              <button onClick={() => window.open(`${API_URL}/api/export/${job.id}`,'_blank')}
                                style={{ padding:'6px 14px', background:'#10b981', color:'#fff', border:'none',
                                  borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer',
                                  boxShadow:'0 2px 6px rgba(16,185,129,0.35)' }}>
                                ⬇ Exportar
                              </button>
                            )}
                            <button onClick={() => deleteJob(job.id)}
                              style={{ padding:'6px 14px', background:'#fff', color:'#ef4444',
                                border:'1px solid #fca5a5', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer' }}>
                              🗑 Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', color:'#94a3b8', fontSize:12, marginTop:24 }}>
          Paper Analyzer · Dr. Mario A. Ramírez Barajas · {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
