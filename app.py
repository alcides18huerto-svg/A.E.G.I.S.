# A.E.G.I.S. - Python Web Application
# Adaptive Environmental & Guardian Intelligence System
# Landing page with ML integration and EN/ES translation

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import pickle

app = Flask(__name__)
CORS(app)

# ============================================================================
# MACHINE LEARNING MODEL - Anomaly Detection
# ============================================================================

class AEGISAnomalyDetector:
    """
    ML-based anomaly detection using Isolation Forest
    Trained on physiological parameters for space mission crew
    """
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            'heartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP',
            'temperature', 'spo2', 'stressIndex', 'sleepQuality',
            'co2Level', 'radiationDose'
        ]
        
    def train(self, data):
        """Train the model on baseline data"""
        X = np.array([[d[f] for f in self.feature_names] for d in data])
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_trained = True
        
    def predict(self, sample):
        """Predict if a sample is anomalous"""
        if not self.is_trained:
            return {'is_anomaly': False, 'confidence': 0.0, 'score': 0.0}
        
        X = np.array([[sample[f] for f in self.feature_names]])
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        score = float(self.model.score_samples(X_scaled)[0])

        # Convert to confidence (0-1)
        confidence = abs(score) / 2.0
        is_anomaly = bool(prediction == -1)

        return {
            'is_anomaly': is_anomaly,
            'confidence': float(min(confidence, 1.0)),
            'score': score
        }

    def save_model(self, filepath='models/anomaly_detector.pkl'):
        """Save trained model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler,
                'feature_names': self.feature_names
            }, f)

    def load_model(self, filepath='models/anomaly_detector.pkl'):
        """Load trained model"""
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.scaler = data['scaler']
                self.feature_names = data['feature_names']
                self.is_trained = True
                return True
        return False

# Repository URL shown on the landing page (override with REPO_URL env var)
REPO_URL = os.environ.get('REPO_URL', 'https://github.com/').rstrip('/')

# Initialize ML detector
ml_detector = AEGISAnomalyDetector()

# Try to load pre-trained model
if not ml_detector.load_model():
    # Generate synthetic training data if no model exists
    print("Generating synthetic training data...")
    np.random.seed(42)
    synthetic_data = []
    for _ in range(500):
        synthetic_data.append({
            'heartRate': np.random.normal(72, 8),
            'heartRateVariability': np.random.normal(45, 10),
            'systolicBP': np.random.normal(120, 10),
            'diastolicBP': np.random.normal(75, 8),
            'temperature': np.random.normal(36.6, 0.3),
            'spo2': np.random.normal(97, 1),
            'stressIndex': np.random.normal(35, 10),
            'sleepQuality': np.random.normal(75, 10),
            'co2Level': np.random.normal(400, 50),
            'radiationDose': np.random.normal(0.08, 0.02)
        })
    ml_detector.train(synthetic_data)
    ml_detector.save_model()
    print("Model trained and saved!")

# ============================================================================
# TRANSLATION SYSTEM - English/Spanish
# ============================================================================

translations = {
    'en': {
        'title': 'A.E.G.I.S.',
        'subtitle': 'Adaptive Environmental & Guardian Intelligence System',
        'description': 'Health monitoring system prototype for space mission crew',
        'features': {
            'ml_detection': 'ML-based Anomaly Detection',
            'real_time': 'Real-time Monitoring',
            'offline': 'Offline-first Architecture',
            'privacy': 'Privacy & Consent',
            'protocols': 'Emergency Protocols',
            'visualization': '3D Body Visualization'
        },
        'sections': {
            'overview': 'Overview',
            'architecture': 'Architecture',
            'surveillance': 'Surveillance Areas',
            'privacy': 'Privacy & Security',
            'team': 'Team',
            'risks': 'Risks',
            'next_steps': 'Next Steps'
        },
        'cta': {
            'demo': 'View Live Demo',
            'docs': 'Documentation',
            'github': 'GitHub Repository'
        }
    },
    'es': {
        'title': 'A.E.G.I.S.',
        'subtitle': 'Sistema Inteligente Adaptativo de Vigilancia Ambiental y Protección',
        'description': 'Prototipo de sistema de monitorización de salud para tripulación en misiones espaciales',
        'features': {
            'ml_detection': 'Detección de Anomalías con ML',
            'real_time': 'Monitoreo en Tiempo Real',
            'offline': 'Arquitectura Offline-first',
            'privacy': 'Privacidad y Consentimiento',
            'protocols': 'Protocolos de Emergencia',
            'visualization': 'Visualización 3D del Cuerpo'
        },
        'sections': {
            'overview': 'Resumen',
            'architecture': 'Arquitectura',
            'surveillance': 'Áreas de Vigilancia',
            'privacy': 'Privacidad y Seguridad',
            'team': 'Equipo',
            'risks': 'Riesgos',
            'next_steps': 'Próximos Pasos'
        },
        'cta': {
            'demo': 'Ver Demo en Vivo',
            'docs': 'Documentación',
            'github': 'Repositorio GitHub'
        }
    }
}

def get_translation(key, lang='en'):
    """Get translation for a key"""
    keys = key.split('.')
    value = translations.get(lang, translations['en'])
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k, '')
        else:
            return ''
    return value

# ============================================================================
# ROUTES
# ============================================================================

@app.route('/')
def landing():
    """Landing page"""
    lang = request.args.get('lang', 'en')
    return render_template(
        'landing.html',
        lang=lang,
        repo_url=REPO_URL,
        t=lambda key: get_translation(key, lang)
    )

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'ml_model_loaded': ml_detector.is_trained,
        'version': '1.0.0'
    })

@app.route('/api/translate', methods=['POST'])
def translate():
    """Translation API endpoint"""
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    source_lang = data.get('source', 'en')
    target_lang = data.get('target', 'es')

    # Simple dictionary-based translation for demo
    # In production, use googletrans or similar
    translation_map = {
        'en-es': {
            'Health monitoring': 'Monitorización de salud',
            'Space mission': 'Misión espacial',
            'Crew': 'Tripulación',
            'Anomaly detection': 'Detección de anomalías',
            'Real-time': 'Tiempo real',
            'Emergency': 'Emergencia',
            'Protocol': 'Protocolo'
        },
        'es-en': {
            'Monitorización de salud': 'Health monitoring',
            'Misión espacial': 'Space mission',
            'Tripulación': 'Crew',
            'Detección de anomalías': 'Anomaly detection',
            'Tiempo real': 'Real-time',
            'Emergencia': 'Emergency',
            'Protocolo': 'Protocol'
        }
    }

    key = f'{source_lang}-{target_lang}'
    translated = translation_map.get(key, {}).get(text, text)

    return jsonify({
        'original': text,
        'translated': translated,
        'source_lang': source_lang,
        'target_lang': target_lang
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """ML prediction endpoint"""
    data = request.get_json(silent=True) or {}
    
    # Validate input
    required_fields = ml_detector.feature_names
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    # Make prediction
    result = ml_detector.predict(data)
    
    return jsonify({
        'prediction': result,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/crew-data')
def crew_data():
    """Sample crew data for demo"""
    return jsonify({
        'crew': [
            {
                'id': 'CDR-01',
                'name': 'Cmdr. Elena Vasquez',
                'role': 'Commander',
                'status': 'nominal',
                'vitals': {
                    'heartRate': 72,
                    'bloodPressure': '120/80',
                    'temperature': 36.6,
                    'spo2': 98
                }
            },
            {
                'id': 'MED-02',
                'name': 'Dr. James Okafor',
                'role': 'Flight Surgeon',
                'status': 'nominal',
                'vitals': {
                    'heartRate': 68,
                    'bloodPressure': '118/75',
                    'temperature': 36.7,
                    'spo2': 97
                }
            }
        ],
        'timestamp': datetime.utcnow().isoformat()
    })

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
