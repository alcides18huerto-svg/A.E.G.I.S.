# 🚀 A.E.G.I.S. — Adaptive Environmental & Guardian Intelligence System

Health monitoring prototype for space mission crew, built for the **NASA Space Apps Challenge**.
Python/Flask landing page with **ML anomaly detection** (Isolation Forest) and **EN/ES** support, ready to deploy on **Render.com**.

🌐 **Repo:** https://github.com/alcides18huerto-svg/A.E.G.I.S.

---

## 📋 English

### Overview

A.E.G.I.S. monitors crew physiological and environmental data and flags anomalies using a machine learning model trained on baseline vital signs. It is an **early-warning prototype**, not a diagnostic or flight-certified system.

### Features

| Feature | Description |
|---|---|
| 🧠 ML anomaly detection | Isolation Forest (scikit-learn) over 10 physiological features |
| 🌍 Bilingual | Full English / Spanish landing page (`?lang=en` / `?lang=es`) |
| ⚡ JSON API | Health check, ML prediction, translation and sample crew data |
| 🔒 Privacy-oriented | Consent, restricted access and audit principles documented |
| 🐳 Docker ready | Dockerfile and docker-compose included |
| ☁️ Render ready | `render.yaml`, `Procfile` and `runtime.txt` included |

### Quick start

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open:
- English: http://localhost:5000/?lang=en
- Spanish: http://localhost:5000/?lang=es
- Health: http://localhost:5000/api/health

> The ML model is trained automatically on synthetic baseline data on first run and cached in `models/anomaly_detector.pkl` (ignored by git).

### API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Landing page (`?lang=en` or `?lang=es`) |
| `GET` | `/api/health` | Service and model status |
| `POST` | `/api/translate` | Demo dictionary-based translation |
| `POST` | `/api/predict` | ML anomaly prediction |
| `GET` | `/api/crew-data` | Sample crew data |

**POST `/api/predict`** — request body:

```json
{
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
}
```

Response:

```json
{
  "prediction": { "is_anomaly": false, "confidence": 0.41, "score": -0.41 },
  "timestamp": "2026-01-01T00:00:00.000000"
}
```

**POST `/api/translate`**:

```json
{ "text": "Health monitoring", "source": "en", "target": "es" }
```

### Machine learning

- **Algorithm:** Isolation Forest (`contamination=0.1`, `random_state=42`) + `StandardScaler`
- **Features:** heart rate, HRV, systolic/diastolic BP, temperature, SpO2, stress index, sleep quality, CO2 level, radiation dose
- **Training data:** 500 synthetic baseline samples (normal distributions around nominal vitals)
- **Output:** `is_anomaly` (bool), `confidence` (0–1), `score` (raw anomaly score)

### Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `FLASK_DEBUG` | `False` | Enable Flask debug mode |

### Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the step-by-step Render.com guide, or use `render.yaml` as a Blueprint.

### License

Research prototype. Not equivalent to clinical validation or flight certification.

---

## 📋 Español

### Resumen

A.E.G.I.S. monitoriza datos fisiológicos y ambientales de la tripulación y detecta anomalías con un modelo de machine learning entrenado sobre signos vitales de referencia. Es un **prototipo de alerta temprana**, no un sistema diagnóstico ni certificado para vuelo.

### Características

| Característica | Descripción |
|---|---|
| 🧠 Detección de anomalías ML | Isolation Forest (scikit-learn) sobre 10 variables fisiológicas |
| 🌍 Bilingüe | Landing completa en inglés / español (`?lang=en` / `?lang=es`) |
| ⚡ API JSON | Salud, predicción ML, traducción y datos de ejemplo |
| 🔒 Orientado a privacidad | Principios de consentimiento, acceso restringido y auditoría |
| 🐳 Listo para Docker | Dockerfile y docker-compose incluidos |
| ☁️ Listo para Render | `render.yaml`, `Procfile` y `runtime.txt` incluidos |

### Inicio rápido

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Abre:
- Inglés: http://localhost:5000/?lang=en
- Español: http://localhost:5000/?lang=es
- Salud: http://localhost:5000/api/health

> El modelo ML se entrena automáticamente con datos sintéticos la primera vez y se guarda en `models/anomaly_detector.pkl` (ignorado por git).

### API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Landing page (`?lang=en` o `?lang=es`) |
| `GET` | `/api/health` | Estado del servicio y del modelo |
| `POST` | `/api/translate` | Traducción de demo basada en diccionario |
| `POST` | `/api/predict` | Predicción de anomalías ML |
| `GET` | `/api/crew-data` | Datos de ejemplo de tripulación |

**POST `/api/predict`** — usa los mismos campos que la sección en inglés. Respuesta:

```json
{
  "prediction": { "is_anomaly": false, "confidence": 0.41, "score": -0.41 },
  "timestamp": "2026-01-01T00:00:00.000000"
}
```

**POST `/api/translate`**:

```json
{ "text": "Monitorización de salud", "source": "es", "target": "en" }
```

### Machine learning

- **Algoritmo:** Isolation Forest (`contamination=0.1`, `random_state=42`) + `StandardScaler`
- **Variables:** frecuencia cardiaca, HRV, presión sistólica/diastólica, temperatura, SpO2, índice de estrés, calidad de sueño, nivel de CO2, dosis de radiación
- **Entrenamiento:** 500 muestras sintéticas de referencia (distribuciones normales alrededor de signos vitales nominales)
- **Salida:** `is_anomaly` (bool), `confidence` (0–1), `score` (puntuación cruda)

### Configuración

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | `5000` | Puerto del servidor |
| `FLASK_DEBUG` | `False` | Activar modo debug de Flask |

### Despliegue

Consulta **[DEPLOYMENT.md](DEPLOYMENT.md)** para la guía paso a paso en Render.com, o usa `render.yaml` como Blueprint.

### Licencia

Prototipo de investigación. No equivale a validación clínica ni certificación de vuelo.

---

## 📁 Project structure / Estructura del proyecto

```
.
├── app.py                 # Flask app: ML detector, translations, routes
├── templates/
│   └── landing.html       # Bilingual landing page (Tailwind CDN)
├── requirements.txt       # Python dependencies
├── Procfile               # Gunicorn process for Render
├── runtime.txt            # Python version hint
├── render.yaml            # Render.com Blueprint
├── Dockerfile             # Container build
├── docker-compose.yml     # Local container setup
├── README.md              # This file (EN/ES)
├── DEPLOYMENT.md          # Render.com deployment guide
└── .gitignore
```

## 🎯 NASA Space Apps Challenge

Developed for the **Space Health / Artificial Intelligence** challenge, addressing continuous human health monitoring for long-duration spaceflight.

Desarrollado para el reto de **Salud Espacial / Inteligencia Artificial**, abordando la monitorización continua de la salud humana en misiones espaciales de larga duración.

