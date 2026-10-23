# 🚀 SUBIR A GITHUB Y RENDER - GUÍA RÁPIDA

## ✅ PROYECTO LIMPIO - LISTO PARA SUBIR

El proyecto ahora está **limpio y organizado** en la raíz. Solo contiene la versión Python/Flask que funciona en Render.

---

## 📁 ESTRUCTURA FINAL

```
aegis/
├── app.py                 ← Aplicación Flask + ML + Traductor
├── templates/
│   └── landing.html       ← Landing page bilingüe
├── requirements.txt       ← Dependencias Python
├── Procfile              ← Configuración Gunicorn
├── runtime.txt           ← Python 3.11
├── render.yaml           ← Config automática para Render
├── Dockerfile            ← Docker (opcional)
├── docker-compose.yml    ← Docker Compose (opcional)
├── README.md             ← Documentación completa
├── DEPLOYMENT.md         ← Guía de despliegue
├── PROJECT_SUMMARY.md    ← Resumen del proyecto
├── QUICKSTART.md         ← Inicio rápido
├── CHECKLIST.md          ← Lista de verificación
└── .gitignore            ← Reglas Git
```

---

## 🎯 PASO 1: SUBIR A GITHUB

### Opción A: Desde tu computadora (recomendado)

```bash
# 1. Abre terminal en la carpeta del proyecto
cd ruta/a/tu/proyecto/aegis

# 2. Inicializa git (si no está hecho)
git init

# 3. Agrega todos los archivos
git add .

# 4. Commit inicial
git commit -m "A.E.G.I.S. - Python/Flask con ML y traductor EN/ES"

# 5. Crea el repo en GitHub.com primero
#    - Ve a https://github.com/new
#    - Nombre: aegis
#    - NO marcar "Initialize with README"
#    - Click "Create repository"

# 6. Conecta y sube
git remote add origin https://github.com/TU_USUARIO/aegis.git
git branch -M main
git push -u origin main
```

### Opción B: Desde GitHub web (más fácil)

1. Ve a tu repo en GitHub: `https://github.com/TU_USUARIO/aegis`
2. Click en **"Add file"** → **"Upload files"**
3. Arrastra **TODOS** estos archivos:
   - `app.py`
   - `requirements.txt`
   - `Procfile`
   - `runtime.txt`
   - `render.yaml`
   - `Dockerfile`
   - `docker-compose.yml`
   - `README.md`
   - `DEPLOYMENT.md`
   - `PROJECT_SUMMARY.md`
   - `QUICKSTART.md`
   - `CHECKLIST.md`
   - `.gitignore`
4. Crea la carpeta `templates/` y sube:
   - `templates/landing.html`
5. Click en **"Commit changes"**

---

## 🎯 PASO 2: DESPLEGAR EN RENDER.COM

### Configuración en Render

1. **Ve a Render Dashboard**
   - https://dashboard.render.com
   - Inicia sesión con GitHub

2. **Crea nuevo Web Service**
   - Click en **"New +"** → **"Web Service"**
   - Click en **"Connect a repository"**
   - Selecciona tu repo: `aegis`
   - Click en **"Connect"**

3. **Configura el servicio**
   ```
   Name: aegis-landing
   Region: Oregon (US West) o la más cercana
   Branch: main
   Root Directory: (DEJAR VACÍO) ← IMPORTANTE
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   Instance Type: Free
   ```

4. **Click en "Create Web Service"**
   - Espera 2-5 minutos
   - Render instalará dependencias y lanzará la app

5. **Verifica el despliegue**
   - Tu URL será: `https://aegis-landing.onrender.com`
   - Prueba:
     - Inglés: `https://aegis-landing.onrender.com/?lang=en`
     - Español: `https://aegis-landing.onrender.com/?lang=es`
     - API: `https://aegis-landing.onrender.com/api/health`

---

## ✅ VERIFICACIÓN FINAL

### Pruebas que debes hacer:

```bash
# 1. Health check
curl https://tu-app.onrender.com/api/health

# Respuesta esperada:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "ml_model_loaded": true,
  "version": "1.0.0"
}

# 2. Landing page
# Abre en navegador: https://tu-app.onrender.com/
# Debe mostrar la landing en inglés

# 3. Versión en español
# Abre: https://tu-app.onrender.com/?lang=es
# Debe mostrar la landing en español

# 4. ML Prediction (opcional)
curl -X POST https://tu-app.onrender.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "heartRate": 72,
    "heartRateVariability": 45,
    "systolicBP": 120,
    "diastolicBP": 75,
    "temperature": 36.6,
    "spo2": 97,
    "stressIndex": 35,
    "sleepQuality": 75,
    "co2Level": 400,
    "radiationDose": 0.08
  }'
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "No aparece el repo en Render"
**Solución**: 
- Ve a https://github.com/settings/installations
- Busca "Render" → Configure
- En "Repository access", selecciona tu repo `aegis`
- Guarda y recarga Render

### Problema: "Build failed"
**Solución**:
- Verifica que `requirements.txt` está en la raíz
- Verifica que `Root Directory` esté vacío en Render
- Revisa los logs en Render para ver el error específico

### Problema: "Application failed to respond"
**Solución**:
- Verifica que `Procfile` contiene: `web: gunicorn app:app`
- Verifica que `app.py` está en la raíz
- Revisa los logs de Render

### Problema: "ModuleNotFoundError"
**Solución**:
- Verifica que todas las dependencias están en `requirements.txt`
- Espera a que Render termine de instalar (puede tardar 2-3 min)

---

## 📊 ARCHIVOS IMPORTANTES

### ✅ Archivos que SÍ deben estar en GitHub:
- `app.py` ← Aplicación principal
- `templates/landing.html` ← Landing page
- `requirements.txt` ← Dependencias
- `Procfile` ← Configuración Gunicorn
- `runtime.txt` ← Versión Python
- `render.yaml` ← Config Render
- `README.md` ← Documentación
- Todos los `.md` de documentación

### ❌ Archivos que NO deben estar:
- `node_modules/` ← Ya está en .gitignore
- `__pycache__/` ← Ya está en .gitignore
- `*.pyc` ← Ya está en .gitignore
- `models/*.pkl` ← Ya está en .gitignore
- Archivos de React/TypeScript antiguos ← YA BORRADOS

---

## 🎉 RESUMEN

### Lo que tienes ahora:
✅ Proyecto limpio y organizado  
✅ Solo Python/Flask (sin React)  
✅ ML con Isolation Forest  
✅ Traductor EN/ES  
✅ Listo para Render.com  
✅ Documentación completa  

### Próximos pasos:
1. Sube a GitHub (Opción A o B arriba)
2. Conecta Render.com
3. Configura con los parámetros indicados
4. Espera el despliegue
5. ¡Prueba tu sitio!

---

## 📞 AYUDA ADICIONAL

- **Guía completa de despliegue**: Ver `DEPLOYMENT.md`
- **Resumen del proyecto**: Ver `PROJECT_SUMMARY.md`
- **Lista de verificación**: Ver `CHECKLIST.md`

---

**Status**: ✅ READY FOR GITHUB & RENDER  
**Tiempo estimado**: 5-10 minutos  
**Costo**: Gratis (Render free tier)
