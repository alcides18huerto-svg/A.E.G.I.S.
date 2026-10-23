# 🚀 A.E.G.I.S. - Adaptive Environmental & Guardian Intelligence System

## 📋 English

### Overview
A.E.G.I.S. is a health monitoring system prototype for space mission crew, developed for the NASA Space Apps Challenge. It features machine learning-based anomaly detection, real-time monitoring, and a 3D wireframe human body visualization.

### Key Features
- 🧠 **ML-based Anomaly Detection**: Isolation Forest algorithm for detecting physiological anomalies
- ⚡ **Real-time Monitoring**: Continuous vital signs tracking with instant alerts
- 🌐 **Offline-first Architecture**: Works without internet connection, syncs when available
- 🔒 **Privacy & Consent**: Explicit consent, restricted access, full audit trail
- 🚨 **Emergency Protocols**: Step-by-step protocols for each alert type
- 🫀 **3D Body Visualization**: Interactive wireframe human body model
- 🌍 **Bilingual Support**: English and Spanish interface

### Technology Stack
- **Backend**: Python 3.11, Flask, scikit-learn, NumPy
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **ML**: Isolation Forest, Z-score analysis, Time series
- **Deployment**: Render.com, Docker, GitHub

### Quick Start

#### Landing Page (Python/Flask)
```bash
cd python-web
pip install -r requirements.txt
python app.py
```
Visit: http://localhost:5000

#### Interactive Demo (React)
```bash
npm install
npm run dev
```
Visit: http://localhost:5173

### Deployment to Render.com

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `aegis-landing`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free
6. Click "Create Web Service"

### API Endpoints

- `GET /` - Landing page (supports `?lang=en` or `?lang=es`)
- `GET /api/health` - Health check
- `POST /api/translate` - Translation service
- `POST /api/predict` - ML anomaly prediction
- `GET /api/crew-data` - Sample crew data

### Machine Learning Model

The anomaly detection uses **Isolation Forest** from scikit-learn:
- Trained on synthetic physiological data
- Features: heart rate, HRV, blood pressure, temperature, SpO2, stress, sleep quality, CO2, radiation
- Outputs: anomaly score, confidence level, binary prediction

### Privacy & Security

- ✅ Explicit consent required for sensitive data
- ✅ Role-based access control
- ✅ Local-first data storage
- ✅ Complete audit trail
- ❌ No covert surveillance
- ❌ No punitive use of data
- ❌ No automatic diagnosis
- ❌ No unauthorized data transfer

### Project Structure
```
aegis/
├── python-web/           # Landing page (Flask)
│   ├── app.py           # Main application
│   ├── templates/       # HTML templates
│   ├── requirements.txt
│   ├── render.yaml      # Render.com config
│   └── Procfile
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── engine/          # ML engine
│   └── hooks/           # React hooks
├── README.md           # This file
└── README_ES.md        # Spanish version
```

### License
Research prototype. Not equivalent to clinical validation or flight certification.

---

## 📋 Español

### Resumen
A.E.G.I.S. es un prototipo de sistema de monitorización de salud para tripulación en misiones espaciales, desarrollado para el NASA Space Apps Challenge. Incluye detección de anomalías basada en machine learning, monitoreo en tiempo real y visualización 3D del cuerpo humano.

### Características Principales
- 🧠 **Detección de Anomalías con ML**: Algoritmo Isolation Forest para detectar anomalías fisiológicas
- ⚡ **Monitoreo en Tiempo Real**: Seguimiento continuo de signos vitales con alertas instantáneas
- 🌐 **Arquitectura Offline-first**: Funciona sin conexión a internet, sincroniza cuando está disponible
- 🔒 **Privacidad y Consentimiento**: Consentimiento explícito, acceso restringido, auditoría completa
- 🚨 **Protocolos de Emergencia**: Protocolos paso a paso para cada tipo de alerta
- 🫀 **Visualización 3D del Cuerpo**: Modelo wireframe interactivo del cuerpo humano
- 🌍 **Soporte Bilingüe**: Interfaz en inglés y español

### Stack Tecnológico
- **Backend**: Python 3.11, Flask, scikit-learn, NumPy
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **ML**: Isolation Forest, Análisis Z-score, Series temporales
- **Despliegue**: Render.com, Docker, GitHub

### Inicio Rápido

#### Landing Page (Python/Flask)
```bash
cd python-web
pip install -r requirements.txt
python app.py
```
Visita: http://localhost:5000

#### Demo Interactiva (React)
```bash
npm install
npm run dev
```
Visita: http://localhost:5173

### Despliegue en Render.com

1. Sube el código a GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Nombre**: `aegis-landing`
   - **Entorno**: `Python 3`
   - **Comando de Build**: `pip install -r requirements.txt`
   - **Comando de Start**: `gunicorn app:app`
   - **Plan**: Free
6. Click en "Create Web Service"

### Endpoints API

- `GET /` - Landing page (soporta `?lang=en` o `?lang=es`)
- `GET /api/health` - Verificación de salud
- `POST /api/translate` - Servicio de traducción
- `POST /api/predict` - Predicción de anomalías ML
- `GET /api/crew-data` - Datos de ejemplo de tripulación

### Modelo de Machine Learning

La detección de anomalías usa **Isolation Forest** de scikit-learn:
- Entrenado con datos fisiológicos sintéticos
- Características: frecuencia cardiaca, HRV, presión arterial, temperatura, SpO2, estrés, calidad de sueño, CO2, radiación
- Salidas: puntuación de anomalía, nivel de confianza, predicción binaria

### Privacidad y Seguridad

- ✅ Consentimiento explícito requerido para datos sensibles
- ✅ Control de acceso basado en roles
- ✅ Almacenamiento de datos local-first
- ✅ Pista de auditoría completa
- ❌ Sin vigilancia encubierta
- ❌ Sin uso punitivo de datos
- ❌ Sin diagnóstico automático
- ❌ Sin transferencia no autorizada de datos

### Estructura del Proyecto
```
aegis/
├── python-web/           # Landing page (Flask)
│   ├── app.py           # Aplicación principal
│   ├── templates/       # Plantillas HTML
│   ├── requirements.txt
│   ├── render.yaml      # Configuración Render.com
│   └── Procfile
├── src/                 # Frontend React
│   ├── components/      # Componentes UI
│   ├── engine/          # Motor ML
│   └── hooks/           # Hooks de React
├── README.md           # Este archivo
└── README_ES.md        # Versión en español
```

### Licencia
Prototipo de investigación. No equivale a validación clínica o certificación de vuelo.

---

## 🎯 NASA Space Apps Challenge

This project was developed for the NASA Space Apps Challenge, addressing the need for advanced health monitoring systems for space missions.

Este proyecto fue desarrollado para el NASA Space Apps Challenge, abordando la necesidad de sistemas avanzados de monitorización de salud para misiones espaciales.

### Challenge Category
- **Space Health**
- **Artificial Intelligence**
- **Human Spaceflight**

### Team
Developed with ❤️ for space exploration

---

**Status**: ✅ Production Ready  
**Deployment**: ✅ Render.com  
**Languages**: ✅ English / Español  
**ML Model**: ✅ Trained and operational
