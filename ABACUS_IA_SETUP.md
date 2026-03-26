# 🚀 Guía de Implementación: Abacus.ia

Esta guía explica cómo configurar la aplicación **Auditor de Seguridad Ambiental: Cuenca de Tula** en la plataforma **Abacus.ia**.

---

## 📝 Resumen de Cambios Implementados

### Archivos Creados/Modificados

✅ **SYSTEM_PROMPT.md** - Instrucciones detalladas de análisis (2,500 palabras)  
✅ **WELCOME_MESSAGE.md** - Mensaje de bienvenida para usuarios  
✅ **.env.example** - Variables de entorno documentadas  
✅ **app-config.json** - Configuración del perfil de aplicación  
✅ **README.md** - Documentación completa actualizada  
✅ **frontend/src/App.jsx** - Interfaz actualizada con banner de bienvenida  

---

## 🔧 Pasos para Configurar en Abacus.ia

### 1. Crear el Agente en Abacus.ia

1. Accede a [Abacus.ia](https://abacus.ia)
2. Crea un nuevo agente de tipo **"Document Analysis"** o **"Custom"**
3. Dale el nombre: **"Auditor de Seguridad Ambiental - Cuenca de Tula"**

### 2. Importar el System Prompt

En la sección de **"System Prompt"** o **"Instructions"** de Abacus.ia:

1. Abre el archivo [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md)
2. Copia todo el contenido
3. Pégalo en el campo de instrucciones del agente

**El system prompt contiene:**
- Protocolo APA 7 estricto
- Flujo de trabajo en 3 niveles
- Estructura del análisis de 2,500 palabras
- Verificaciones de integridad de datos
- Comando especial `/Informe_Profundo`

### 3. Configurar el Mensaje de Bienvenida

En la sección **"Welcome Message"** o **"Initial Prompt"**:

1. Abre el archivo [WELCOME_MESSAGE.md](WELCOME_MESSAGE.md)
2. Copia el contenido (excepto el header de nivel 1 si duplica)
3. Pégalo en el campo de bienvenida

**Resultado:** Los usuarios verán el mensaje **"🌊 Auditor de Seguridad Ambiental"** al iniciar sesión.

### 4. Configurar Modelos de IA

En la sección **"Model Configuration"** o **"AI Settings"**:

| Parámetro | Valor | Propósito |
|-----------|-------|----------|
| **Modelo Base** | `llama-3.3-70b-versatile` (o equivalente) | Análisis técnico riguroso |
| **Temperatura** | `0.2` | Respuestas conservadoras, sin alucinaciones |
| **Max Tokens** | `2048` | Límite por respuesta |
| **Top P** | `0.95` | Diversidad controlada |

### 5. Configurar Límites de Capacidad

En **"Resource Limits"** o **"Usage Configuration"**:

```json
{
  "maxDocumentsPerSession": 5,
  "maxDocumentSize": "50MB",
  "acceptedFormats": ["pdf", "docx", "txt"],
  "maxAnalysisLength": 2500,
  "commandAllowed": ["/Informe_Profundo", "/Limpiar"]
}
```

### 6. Habilitar Funcionalidades de Upload

En **"File Upload Settings"**:

- ✅ Permitir PDF
- ✅ Permitir DOCX
- ✅ Permitir TXT
- ✅ Máximo 5 archivos por sesión

### 7. Configurar Exportación

En **"Export Options"**:

- ✅ **PDF Export** (para informes finales)
- ✅ **Excel Export** (para fichas técnicas)
- ✅ **JSON Export** (para integración)

---

## 📌 Cómo Usar en Abacus.ia

### Flujo Típico del Usuario

#### Paso 1: Carga de Documentos
```
Usuario: Carga 3 artículos PDF sobre contaminación hídrica en Tula
Sistema: Extrae títulos, genera referencias APA 7
```

#### Paso 2: Consulta Rápida
```
Usuario: ¿Cuál es el límite máximo de arsénico permitido?
Sistema: Busca en los documentos cargados, cita textualmente
```

#### Paso 3: Informe Profundo
```
Usuario: /Informe_Profundo
Sistema: Genera análisis de 2,500 palabras + Matriz de Intersección
```

#### Paso 4: Exportación
```
Usuario: Exportar como PDF
Sistema: Compila el informe en PDF descargable
```

---

## 🔐 Verificación de Configuración

Después de configurar, prueba los siguientes escenarios:

### Test 1: Mensaje de Bienvenida
- [ ] Al iniciar, aparece el banner azul con "🌊 Auditor de Seguridad Ambiental"
- [ ] Hay un botón "✕ Cerrar" funcional

### Test 2: Carga de Archivo
- [ ] Puedes cargar un PDF de prueba
- [ ] Se genera automáticamente una referencia APA 7
- [ ] Se muestra en la tabla con estado "Procesando"

### Test 3: Análisis Básico
- [ ] Completa el análisis (estado "Completado")
- [ ] Se puede exportar como Excel
- [ ] El archivo contiene metadatos + análisis + referencias

### Test 4: Comando /Informe_Profundo
- [ ] Escribe `/Informe_Profundo`
- [ ] Se genera informe de 2,500 palabras
- [ ] Aparece la Matriz de Intersección

### Test 5: Restricciones
- [ ] Si faltan datos, se reporta: "Información no disponible..."
- [ ] No inventa resultados
- [ ] Todo cita la fuente

---

## 🎯 Personalización Avanzada

### A. Cambiar el Territorio (actualmente Cuenca de Tula)

En [app-config.json](app-config.json), modifica:

```json
"geography": {
  "territory": "Tu región aquí",
  "focus": [
    "Temas relevantes",
    "Líneas de investigación"
  ]
}
```

Luego actualiza el SYSTEM_PROMPT reemplazando "Cuenca de Tula" con el nuevo territorio.

### B. Ajustar Límites de Palabra

En [app-config.json](app-config.json):

```json
"analysis": {
  "targetWordCount": 3000,  // O el que prefieras
  "maxTokens": 2500
}
```

### C. Agregar Nuevos Comandos

En [app-config.json](app-config.json):

```json
"commands": {
  "deepReport": "/Informe_Profundo",
  "tuComando": "/Tu_Comando_Aqui"
}
```

Luego documenta en SYSTEM_PROMPT.md.

---

## 🆘 Troubleshooting en Abacus.ia

### Problema: El message de bienvenida no aparece
**Solución:**
- Verifica que esté en el campo correcto (Welcome Message, no System Prompt)
- Recarga la página o reinicia la sesión

### Problema: No procesa archivos PDF
**Solución:**
- Verifica que PDF esté habilitado en "File Upload Settings"
- Comprueba que el archivo sea menor a 50MB
- Intenta con otro PDF

### Problema: Las referencias APA 7 están incompletas
**Solución:**
- Asegúrate de que el PDF tenga metadatos visibles
- Si no hay autor, debe mostrar "Autor Corporativo"
- Si no hay año, debe mostrar "(s.f.)"
- **NUNCA debe inventar datos**

### Problema: /Informe_Profundo tarda mucho
**Solución:**
- Es normal: procesa 5 documentos simultáneamente
- Espera hasta 2 minutos
- Verifica que la temperatura sea 0.2 (evita divagaciones)

---

## 📊 Integración con Datos Externos (Opcional)

Si deseas conectar fuentes externas (bases de datos legales, repositorios CONAGUA, etc.):

1. En Abacus.ia, accede a **"Integrations"**
2. Conecta la fuente (API, webhook, base de datos)
3. Configura cómo el agente debe consultarla
4. **IMPORTANTE:** Documenta en SYSTEM_PROMPT qué fuentes externas están autorizadas

---

## ✅ Checklist Final

Antes de publicar en producción:

- [ ] System prompt cargado completamente
- [ ] Mensaje de bienvenida visible
- [ ] Variables de entorno configuradas (.env backend, .env.local frontend)
- [ ] Archivo de configuración (app-config.json) cargado
- [ ] Test de carga de 5 documentos exitoso
- [ ] Comando `/Informe_Profundo` genera 2,500+ palabras
- [ ] Matriz de Intersección genera correctamente
- [ ] Exportación a PDF funciona
- [ ] Exportación a Excel funciona
- [ ] Restricción de datos externos verificada
- [ ] Documentación (README, SYSTEM_PROMPT) accesible

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa [README.md](README.md) - Guía general
2. Revisa [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - Instrucciones de análisis
3. Contacta a: **Dr. Mario A. Ramírez Barajas**

---

**¡Listo para auditar con rigor! 🌊**
