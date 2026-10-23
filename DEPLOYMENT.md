# 🚀 Despliegue en Render.com / Deployment on Render.com

Este proyecto corre como **Web Service** de Render usando el Python runtime. Todos los archivos están en la **raíz** del repositorio.

---

## 📋 Español

### Requisitos previos
- Cuenta de [GitHub](https://github.com)
- Cuenta de [Render](https://dashboard.render.com) (free tier disponible)
- Git instalado localmente

### 1. Subir el repositorio a GitHub

```bash
git init
git add .
git commit -m "A.E.G.I.S. - Flask + ML + EN/ES"
git branch -M main
git remote add origin https://github.com/alcides18huerto-svg/A.E.G.I.S..git
git push -u origin main
```

### 2. Crear el servicio en Render

**Opción A — Blueprint (recomendado):** con el repo en GitHub, ve a Render → **New +** → **Blueprint**, elige el repo y aplica `render.yaml`.

**Opción B — Manual:** Render → **New +** → **Web Service** → conecta el repo y configura:

| Campo | Valor |
|---|---|
| Name | `aegis-landing` |
| Language / Environment | `Python 3` |
| Branch | `main` |
| Root Directory | **vacío** (los archivos están en la raíz) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app` |
| Health Check Path | `/api/health` |
| Instance Type | `Free` |

Variables de entorno (opcionales, ya incluidas en `render.yaml`):

```
PYTHON_VERSION=3.11.9
FLASK_ENV=production
FLASK_DEBUG=false
```

> ⚠️ **Versión de Python — obligatorio.** Render usa **Python 3.14.8** por defecto. `scikit-learn==1.3.2` no publica wheels para 3.13/3.14, así que pip intenta compilarlo desde el código fuente y falla en `_barnes_hut_tsne.pyx` / `_utils.pyx`. La versión se fija de dos formas (la variable gana sobre el archivo):
> - Archivo `.python-version` en la raíz → `3.11.9`
> - Variable de entorno `PYTHON_VERSION` → `3.11.9` (versión completa, sin prefijo `python-`)
>
> `runtime.txt` **no está soportado** por Render en servicios nativos: se ignora.

Wheels disponibles por versión de Python para `scikit-learn 1.3.2`: `cp38` `cp39` `cp310` `cp311` `cp312` ✓ — `cp313` `cp314` ✗

### 3. Verificar el despliegue

```bash
curl https://aegis-landing.onrender.com/api/health
```

Respuesta esperada:

```json
{
  "status": "healthy",
  "ml_model_loaded": true,
  "timestamp": "2026-01-01T00:00:00.000000",
  "version": "1.0.0"
}
```

Luego abre `https://aegis-landing.onrender.com/?lang=en` y `?lang=es`.

### Alternativa: Docker

```bash
docker compose up --build
# http://localhost:5000
```

---

## 📋 English

### Prerequisites
- [GitHub](https://github.com) account
- [Render](https://dashboard.render.com) account (free tier available)
- Git installed locally

### 1. Push the repository to GitHub

```bash
git init
git add .
git commit -m "A.E.G.I.S. - Flask + ML + EN/ES"
git branch -M main
git remote add origin https://github.com/alcides18huerto-svg/A.E.G.I.S..git
git push -u origin main
```

### 2. Create the Render service

**Option A — Blueprint (recommended):** Render → **New +** → **Blueprint**, pick the repo, apply `render.yaml`.

**Option B — Manual:** Render → **New +** → **Web Service**, connect the repo and set:

| Field | Value |
|---|---|
| Name | `aegis-landing` |
| Language / Environment | `Python 3` |
| Branch | `main` |
| Root Directory | **empty** (files live in the repo root) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app` |
| Health Check Path | `/api/health` |
| Instance Type | `Free` |

Environment variables (optional, already set in `render.yaml`):

```
PYTHON_VERSION=3.11.0
FLASK_ENV=production
FLASK_DEBUG=false
```

### 3. Verify the deployment

```bash
curl https://aegis-landing.onrender.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "ml_model_loaded": true,
  "timestamp": "2026-01-01T00:00:00.000000",
  "version": "1.0.0"
}
```

Then open `https://aegis-landing.onrender.com/?lang=en` and `?lang=es`.

### Alternative: Docker

```bash
docker compose up --build
# http://localhost:5000
```

---

## 🔧 Solución de problemas / Troubleshooting

| Síntoma / Symptom | Causa / Cause | Solución / Fix |
|---|---|---|
| `Build failed` | `requirements.txt` no está en la raíz | Verifica que `Root Directory` esté vacío |
| `No open ports detected` | Render no respeta `PORT` | Usa `gunicorn app:app` (Render inyecta `$PORT`) |
| `ModuleNotFoundError` | Dependencia faltante | Añádela a `requirements.txt` y redeploy |
| `TemplateNotFound: landing.html` | Falta la carpeta `templates/` | Debe estar en la raíz junto a `app.py` |
| ML model not loading | `models/` está en `.gitignore` (es intencional) | El modelo se entrena y guarda automáticamente al arrancar |
| Repo no aparece en Render | App de GitHub sin permisos sobre el repo | GitHub → Settings → Applications → Render → configura acceso |

---

## 📊 Costos / Costs

### Free tier
- 750 horas/mes, HTTPS automático, auto-deploy desde GitHub
- ⚠️ Se suspende tras 15 min de inactividad (despierta en la siguiente petición)

### Producción
- Plan Starter desde ~$7/mes: sin suspensión, más recursos, dominio personalizado

---

## 📞 Soporte / Support
- [Render Docs](https://render.com/docs)
- [Flask Docs](https://flask.palletsprojects.com/)
- [scikit-learn Docs](https://scikit-learn.org/)
