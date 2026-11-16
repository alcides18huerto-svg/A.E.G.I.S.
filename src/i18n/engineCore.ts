export const ENGINE_CORE_EN: Record<string, string> = {
  // Spanish runtime text -> English

  // Crew roles
  'Comandante': 'Commander',
  'Médico de Vuelo': 'Flight Surgeon',
  'Ingeniera de Sistemas': 'Systems Engineer',
  'Científica': 'Scientist',

  // Pipeline stage names
  'Captura': 'Capture',
  'Calidad': 'Quality',
  'Referencia': 'Baseline',
  'Anomalías': 'Anomalies',
  'Seguridad': 'Safety',
  'Interfaz': 'Interface',

  // Anomaly check names
  'Frecuencia cardiaca': 'Heart rate',
  'Variabilidad cardiaca (HRV)': 'Heart rate variability (HRV)',
  'Presión arterial sistólica': 'Systolic blood pressure',
  'Presión sistólica': 'Systolic pressure',
  'Temperatura corporal': 'Body temperature',
  'Calidad de sueño': 'Sleep quality',
  'Índice de estrés': 'Stress index',
  'Glucosa en sangre': 'Blood glucose',
  'Estado de ánimo': 'Mood',

  // Anomaly parameter labels
  'Tendencia FC': 'HR trend',
  'CO2 ambiental': 'Ambient CO2',
  'Radiación GCR (dosis media diaria)': 'GCR radiation (mean daily dose)',
  'Evento de Partículas Solares': 'Solar Particle Event',
  'Dosis de carrera acumulada': 'Accumulated career dose',
  '# sostenida': '# sustained',

  // Direction / trend descriptors
  'elevado': 'elevated',
  'reducido': 'reduced',
  'elevada': 'elevated',
  'reducida': 'reduced',
  'ascendente': 'ascending',
  'descendente': 'descending',
  'sostenida': 'sustained',

  // Anomaly descriptions
  '# #: # (ref: # ± #, z=#)': '# #: # (ref: # ± #, z=#)',
  'Tendencia # en FC: ## bpm en últimas 5 lecturas': 'Trend # in HR: ## bpm over the last 5 readings',
  'CO2 # ppm (>4000; límite ppCO2 1-h ≤3 mmHg ≈3950 ppm [V2 6004]). Vigilar cefalea.': 'CO2 # ppm (>4000; ppCO2 1-h limit ≤3 mmHg ≈3950 ppm [V2 6004]). Watch for headache.',
  'CO2 # ppm (zona nominal ISS ~2500 ppm). Vigilar media 24-h.': 'CO2 # ppm (ISS nominal zone ~2500 ppm). Monitor 24-h mean.',
  '# — Valor actual: #': '# — Current value: #',
  'Media diaria # mSv > límite GCR espacio libre # mSv/día [V1 4033].': 'Daily mean # mSv > free-space GCR limit # mSv/day [V1 4033].',
  'EPE acumulado # mSv (#% del límite # mSv [V1 4031]).': 'Accumulated SPE # mSv (#% of the # mSv limit [V1 4031]).',
  'Dosis total de carrera # mSv (#% del límite de 600 mSv [V1 4030]). ALARA.': 'Total career dose # mSv (#% of the 600 mSv limit [V1 4030]). ALARA.',
  '# # de forma sostenida en # lecturas (z=#, ref #±#)': '# # sustained for # readings (z=#, ref #±#)',

  // Area indicators
  'FC: # bpm': 'HR: # bpm',
  'HRV: # ms': 'HRV: # ms',
  'PA: #/#': 'BP: #/#',
  'Temp: #°C': 'Temp: #°C',
  'Temp piel: #°C': 'Skin temp: #°C',
  'SpO2: #%': 'SpO2: #%',
  'Sueño: #/100': 'Sleep: #/100',
  'Estrés: #/100': 'Stress: #/100',
  'Actividad: #/10': 'Activity: #/10',
  'CO2': 'CO2',
  'Ambiente': 'Environment',
  'Ruido': 'Noise',
  'Radiación tasa': 'Radiation rate',
  'Radiación acumulada': 'Accumulated radiation',
  'CO2: # ppm': 'CO2: # ppm',
  'Ambiente: #°C': 'Environment: #°C',
  'Ruido: # dB': 'Noise: # dB',
  'Rad tasa: # mSv/h': 'Rad rate: # mSv/h',
  'Rad acumulada misión: # mSv (#% de 600 mSv de carrera)': 'Accumulated mission radiation: # mSv (#% of 600 mSv career)',
  'ΔDMO estimada: #% (hip, est.)': 'Estimated ΔBMD: #% (hip, est.)',
  'Adherencia ejercicio: #%': 'Exercise adherence: #%',
  'Referencia sin contramedida: 1-1.5 %/mes (LeBlanc 2000; Lang 2004)': 'Reference without countermeasure: 1-1.5 %/month (LeBlanc 2000; Lang 2004)',

  // Area notes
  '⚠ Sensor FC degradado': '⚠ HR sensor degraded',
  'Biomarcadores sanguíneos no instrumentados (fuera de alcance)': 'Blood biomarkers not instrumented (out of scope)',
  '⚠ Evento EPE: +# mSv': '⚠ SPE event: +# mSv',
  'DMO real solo validable por DXA pre/post-misión (HRP-F07-ERFT.R2)': 'Actual BMD only verifiable by pre/post-mission DXA (HRP-F07-ERFT.R2)',

  // Risk drivers
  'EMERGENCIA: #': 'EMERGENCY: #',
  'Crítico: #': 'Critical: #',
  'Área en alerta: #': 'Area in alert: #',
  'Área en vigilancia: #': 'Area under watch: #',
  'Dosis de carrera #%': 'Career dose #%',

  // Data source references
  'Baseline individual A.E.G.I.S. (z-score estadístico)': 'Individual A.E.G.I.S. baseline (statistical z-score)',
  'Baseline individual A.E.G.I.S. (tendencia lineal)': 'Individual A.E.G.I.S. baseline (linear trend)',
  'A.E.G.I.S. detector de persistencia (ventana móvil, 4 muestras)': 'A.E.G.I.S. persistence detector (moving window, 4 samples)',

  // Evaluation note
  'Split temporal por individuo: baseline entrenado solo con la ventana nominal del propio tripulante; la ventana de test es independiente. El índice de confianza no es probabilidad calibrada.': "Temporal split per individual: baseline trained only on the crew member's own nominal window; the test window is independent. The confidence index is not a calibrated probability.",
};
