# 🚀 Guía de Despliegue en Render.com / Deployment Guide

## 📋 English Version

### Step-by-Step Deployment to Render.com

#### Prerequisites
- GitHub account
- Render.com account (free tier available)
- Git installed locally

#### 1. Prepare Your Repository

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: A.E.G.I.S. landing page with ML"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/aegis.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 2. Deploy to Render.com

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Repository**
   - Choose your GitHub repository: `aegis`
   - Click "Connect"

4. **Configure Service**
   - **Name**: `aegis-landing` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `python-web`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

5. **Choose Plan**
   - Select "Free" plan (sufficient for demo)

6. **Environment Variables** (Optional)
   - Click "Advanced" → "Add Environment Variable"
   - Add:
     - `FLASK_ENV` = `production`
     - `FLASK_DEBUG` = `false`

7. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-5 minutes)

8. **Access Your Site**
   - Your site will be available at: `https://aegis-landing.onrender.com`
   - Test endpoints:
     - Landing: `https://aegis-landing.onrender.com/`
     - English: `https://aegis-landing.onrender.com/?lang=en`
     - Spanish: `https://aegis-landing.onrender.com/?lang=es`
     - Health: `https://aegis-landing.onrender.com/api/health`

#### 3. Test the Deployment

```bash
# Test health endpoint
curl https://aegis-landing.onrender.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-...",
#   "ml_model_loaded": true,
#   "version": "1.0.0"
# }
```

#### 4. Deploy React Demo (Optional)

If you want to deploy the interactive React demo:

1. **Create another Web Service** in Render
2. **Root Directory**: Leave empty (root of repo)
3. **Environment**: `Static Site`
4. **Build Command**: `npm install && npm run build`
5. **Publish Directory**: `dist`

---

## 📋 Versión en Español

### Despliegue Paso a Paso en Render.com

#### Requisitos Previos
- Cuenta de GitHub
- Cuenta de Render.com (plan gratuito disponible)
- Git instalado localmente

#### 1. Preparar tu Repositorio

```bash
# Inicializar repositorio git (si no está hecho)
git init

# Agregar todos los archivos
git add .

# Commit
git commit -m "Commit inicial: Landing page A.E.G.I.S. con ML"

# Agregar remote de GitHub
git remote add origin https://github.com/TU_USUARIO/aegis.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

#### 2. Desplegar en Render.com

1. **Ir al Dashboard de Render**
   - Visitar: https://dashboard.render.com
   - Iniciar sesión con GitHub

2. **Crear Nuevo Web Service**
   - Click en botón "New +"
   - Seleccionar "Web Service"

3. **Conectar Repositorio**
   - Elegir tu repositorio de GitHub: `aegis`
   - Click en "Connect"

4. **Configurar Servicio**
   - **Nombre**: `aegis-landing` (o tu nombre preferido)
   - **Región**: Elegir la más cercana
   - **Rama**: `main`
   - **Directorio Raíz**: `python-web`
   - **Entorno**: `Python 3`
   - **Comando de Build**: `pip install -r requirements.txt`
   - **Comando de Start**: `gunicorn app:app`

5. **Elegir Plan**
   - Seleccionar plan "Free" (suficiente para demo)

6. **Variables de Entorno** (Opcional)
   - Click en "Advanced" → "Add Environment Variable"
   - Agregar:
     - `FLASK_ENV` = `production`
     - `FLASK_DEBUG` = `false`

7. **Desplegar**
   - Click en "Create Web Service"
   - Esperar el despliegue (2-5 minutos)

8. **Acceder a tu Sitio**
   - Tu sitio estará disponible en: `https://aegis-landing.onrender.com`
   - Probar endpoints:
     - Landing: `https://aegis-landing.onrender.com/`
     - Inglés: `https://aegis-landing.onrender.com/?lang=en`
     - Español: `https://aegis-landing.onrender.com/?lang=es`
     - Salud: `https://aegis-landing.onrender.com/api/health`

#### 3. Probar el Despliegue

```bash
# Probar endpoint de salud
curl https://aegis-landing.onrender.com/api/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2024-...",
#   "ml_model_loaded": true,
#   "version": "1.0.0"
# }
```

#### 4. Desplegar Demo React (Opcional)

Si quieres desplegar la demo interactiva de React:

1. **Crear otro Web Service** en Render
2. **Directorio Raíz**: Dejar vacío (raíz del repo)
3. **Entorno**: `Static Site`
4. **Comando de Build**: `npm install && npm run build`
5. **Directorio de Publicación**: `dist`

---

## 🔧 Troubleshooting / Solución de Problemas

### English

**Issue**: Deployment fails
- **Solution**: Check build logs in Render dashboard
- **Common fix**: Ensure `requirements.txt` is in `python-web/` directory

**Issue**: Site shows 500 error
- **Solution**: Check that `gunicorn app:app` is correct
- **Verify**: `app.py` exists in root of `python-web/`

**Issue**: ML model not loading
- **Solution**: Model is auto-generated on first run
- **Check**: Logs should show "Model trained and saved!"

### Español

**Problema**: El despliegue falla
- **Solución**: Revisar logs de build en dashboard de Render
- **Fix común**: Asegurar que `requirements.txt` está en directorio `python-web/`

**Problema**: Sitio muestra error 500
- **Solución**: Verificar que `gunicorn app:app` es correcto
- **Verificar**: `app.py` existe en raíz de `python-web/`

**Problema**: Modelo ML no carga
- **Solución**: Modelo se auto-genera en primera ejecución
- **Revisar**: Logs deben mostrar "Model trained and saved!"

---

## 📊 Costos / Costs

### Render.com Free Tier
- ✅ 750 hours/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deploy from GitHub
- ⚠️ Sleeps after 15 min of inactivity (wakes up on next request)

### For Production (Paid)
- $7/month for Starter plan
- No sleep issues
- More resources
- Custom domain support

---

## 🎯 Checklist Before Submission

### English
- [ ] Code pushed to GitHub
- [ ] Landing page deployed on Render.com
- [ ] English version works (`?lang=en`)
- [ ] Spanish version works (`?lang=es`)
- [ ] ML model loads successfully
- [ ] Health endpoint returns 200
- [ ] README is complete
- [ ] All features documented

### Español
- [ ] Código subido a GitHub
- [ ] Landing page desplegada en Render.com
- [ ] Versión en inglés funciona (`?lang=en`)
- [ ] Versión en español funciona (`?lang=es`)
- [ ] Modelo ML carga exitosamente
- [ ] Endpoint de salud retorna 200
- [ ] README está completo
- [ ] Todas las características documentadas

---

## 📞 Support / Soporte

### English
- Render Documentation: https://render.com/docs
- Flask Documentation: https://flask.palletsprojects.com/
- scikit-learn: https://scikit-learn.org/

### Español
- Documentación Render: https://render.com/docs
- Documentación Flask: https://flask.palletsprojects.com/
- scikit-learn: https://scikit-learn.org/

---

**Status**: ✅ Ready for Deployment  
**Last Updated**: 2024  
**Deployment Time**: ~5 minutes
