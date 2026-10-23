# 🚀 Quick Start Guide / Guía de Inicio Rápido

## English

### 1. Upload to GitHub

```bash
# Initialize git
git init
git add .
git commit -m "A.E.G.I.S. - Complete project with ML and bilingual support"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/aegis.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Render.com

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `aegis`
4. Configure:
   - **Root Directory**: `python-web`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click "Create Web Service"
6. Wait 2-5 minutes for deployment

### 3. Test Your Site

- Landing (EN): `https://your-app.onrender.com/?lang=en`
- Landing (ES): `https://your-app.onrender.com/?lang=es`
- API Health: `https://your-app.onrender.com/api/health`

---

## Español

### 1. Subir a GitHub

```bash
# Inicializar git
git init
git add .
git commit -m "A.E.G.I.S. - Proyecto completo con ML y soporte bilingüe"

# Agregar remote (reemplaza con tu URL de GitHub)
git remote add origin https://github.com/TU_USUARIO/aegis.git
git branch -M main
git push -u origin main
```

### 2. Desplegar en Render.com

1. Ir a https://dashboard.render.com
2. Click en "New +" → "Web Service"
3. Conectar tu repo de GitHub: `aegis`
4. Configurar:
   - **Directorio Raíz**: `python-web`
   - **Entorno**: `Python 3`
   - **Comando de Build**: `pip install -r requirements.txt`
   - **Comando de Start**: `gunicorn app:app`
5. Click en "Create Web Service"
6. Esperar 2-5 minutos para el despliegue

### 3. Probar tu Sitio

- Landing (EN): `https://tu-app.onrender.com/?lang=en`
- Landing (ES): `https://tu-app.onrender.com/?lang=es`
- API Salud: `https://tu-app.onrender.com/api/health`

---

## 📁 Project Structure / Estructura del Proyecto

```
aegis/
├── python-web/          # Landing page (Python/Flask)
│   ├── app.py          # Main app / App principal
│   ├── templates/      # HTML templates / Plantillas HTML
│   ├── requirements.txt
│   ├── render.yaml     # Render config
│   └── Procfile
│
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── engine/         # ML engine / Motor ML
│   └── hooks/
│
├── README.md           # Documentation / Documentación
├── DEPLOYMENT.md       # Deployment guide / Guía de despliegue
└── PROJECT_SUMMARY.md  # Project overview / Resumen del proyecto
```

---

## 🔧 Local Development / Desarrollo Local

### Python Landing Page

```bash
cd python-web
pip install -r requirements.txt
python app.py
# Visit: http://localhost:5000
```

### React Demo

```bash
npm install
npm run dev
# Visit: http://localhost:5173
```

---

## 🎯 Key Features / Características Principales

✅ Machine Learning (Isolation Forest)  
✅ Bilingual (English/Spanish)  
✅ Real-time monitoring  
✅ 3D body visualization  
✅ Emergency protocols  
✅ Offline-first architecture  
✅ Privacy & consent  
✅ API endpoints  
✅ Docker support  
✅ Ready for Render.com  

---

## 📞 Need Help? / ¿Necesitas Ayuda?

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Full Documentation**: See `README.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`

---

**Status**: ✅ Ready for GitHub & Render.com  
**Time to Deploy**: ~5 minutes  
**Cost**: Free (Render.com free tier)
