# Paper Analyzer (nueva app)

Aplicación para analizar papers académicos por lotes (5-10 archivos) y exportar resultados a Excel.

## Estructura
- `backend/`: API Node.js + BullMQ + Redis + análisis de texto.
- `frontend/`: React + Vite + Tailwind (UI para subida, estado y exportación).

## Pasos de instalación
1. `cd backend && npm install`
2. `cd ../frontend && npm install`

## Ejecutar local
- `cd backend && npm run dev`
- `cd frontend && npm run dev`

## Despliegue en Render
- Repositorio con la carpeta raíz y `render.yaml`.
- Servicio backend, servicio frontend, servicio worker, Redis y base de datos.
