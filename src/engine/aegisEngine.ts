// ============================================================
// A.E.G.I.S. Engine - Core Processing Engine
// Stages: Capture → Quality → Baseline → Anomaly → Safety → Interface
// ============================================================

import {
  CrewMember, SensorReading, QualityFlags, BaselineProfile,
  AnomalyResult, SafetyAlert, SystemState, EngineConfig,
  SurveillanceArea, AreaAssessment
} from './types';

// ---- INITIAL CREW ----
const INITIAL_CREW: CrewMember[] = [
  { id: 'CDR-01', name: 'Cmdr. Elena Vasquez', role: 'Comandante', baselineEstablished: true, baselineDays: 45, status: 'nominal' },
  { id: 'MED-02', name: 'Dr. James Okafor', role: 'Médico de Vuelo', baselineEstablished: true, baselineDays: 45, status: 'nominal' },
  { id: 'ENG-03', name: 'Ing. Yuki Tanaka', role: 'Ingeniera de Sistemas', baselineEstablished: true, baselineDays: 30, status: 'nominal' },
  { id: 'SCI-04', name: 'Dra. Amara Diallo', role: 'Científica', baselineEstablished: false, baselineDays: 8, status: 'nominal' },
];

const DEFAULT_CONFIG: EngineConfig = {
  simulationSpeed: 1,
  sensorNoiseLevel: 0.1,
  faultInjectionRate: 0.02,
  anomalyProbability: 0.05,
};

// ---- SAFETY RULES (Independent from AI) ----
const SAFETY_RULES = [
  { id: 'SR-HR-HIGH', param: 'heartRate', threshold: 180, direction: 'above' as const, severity: 'critical' as const, rule: 'Frecuencia cardiaca > 180 bpm', action: 'Evaluación médica inmediata. Detener actividad física.' },
  { id: 'SR-HR-LOW', param: 'heartRate', threshold: 40, direction: 'below' as const, severity: 'critical' as const, rule: 'Frecuencia cardiaca < 40 bpm', action: 'Evaluación médica urgente. Verificar consciencia.' },
  { id: 'SR-BP-SYS', param: 'systolicBP', threshold: 200, direction: 'above' as const, severity: 'critical' as const, rule: 'Presión sistólica > 200 mmHg', action: 'Alerta de crisis hipertensiva. Protocolo de emergencia.' },
  { id: 'SR-BP-DIA', param: 'diastolicBP', threshold: 130, direction: 'above' as const, severity: 'critical' as const, rule: 'Presión diastólica > 130 mmHg', action: 'Alerta de crisis hipertensiva. Protocolo de emergencia.' },
  { id: 'SR-TEMP-HIGH', param: 'temperature', threshold: 39.5, direction: 'above' as const, severity: 'warning' as const, rule: 'Temperatura corporal > 39.5°C', action: 'Controlar fiebre. Hidratación y reposo.' },
  { id: 'SR-SPO2', param: 'spo2', threshold: 90, direction: 'below' as const, severity: 'critical' as const, rule: 'SpO2 < 90%', action: 'Posible hipoxia. Verificar sistema de soporte vital.' },
  { id: 'SR-CO2', param: 'co2Level', threshold: 5000, direction: 'above' as const, severity: 'warning' as const, rule: 'CO2 ambiental > 5000 ppm', action: 'Ventilación de emergencia. Verificar scrubbers.' },
  { id: 'SR-RAD', param: 'radiationDose', threshold: 0.5, direction: 'above' as const, severity: 'warning' as const, rule: 'Radiación > 0.5 mSv/h', action: 'Refugio antiradiación. Limitar EVA.' },
];

// ============================================================
// STAGE 1: SENSOR DATA CAPTURE
// ============================================================
function generateSensorReading(crewId: string, config: EngineConfig, time: number, anomalyActive: Map<string, boolean>): SensorReading {
  const crewIdx = INITIAL_CREW.findIndex(c => c.id === crewId);
  const baseHR = [72, 68, 74, 70][crewIdx];
  const baseHRV = [45, 52, 38, 48][crewIdx];
  const baseSysBP = [118, 122, 115, 120][crewIdx];
  const baseTemp = [36.6, 36.7, 36.5, 36.8][crewIdx];
  const baseSleep = [78, 82, 72, 75][crewIdx];
  const baseStress = [35, 30, 42, 38][crewIdx];

  // Circadian rhythm modulation
  const hourOfDay = (time / 3600) % 24;
  const circadianHR = Math.sin((hourOfDay - 6) * Math.PI / 12) * 8;
  const circadianTemp = Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.3;

  const noise = (scale: number) => (Math.random() - 0.5) * 2 * scale * config.sensorNoiseLevel;

  let hr = baseHR + circadianHR + noise(5);
  let hrv = baseHRV + noise(8);
  let sysBP = baseSysBP + noise(5);
  let diaBP = 75 + noise(4);
  let temp = baseTemp + circadianTemp + noise(0.2);
  let skinTemp = temp - 1.5 + noise(0.3);
  let spo2 = 97 + noise(1);
  let activity = Math.max(0, Math.min(10, 3 + Math.sin(hourOfDay * Math.PI / 8) * 3 + noise(2)));
  let sleepQ = baseSleep + noise(8);
  let stress = baseStress + noise(10);
  let co2 = 400 + noise(50) + (activity > 5 ? 100 : 0);
  let ambTemp = 22 + noise(1);
  let noiseLvl = 35 + noise(5) + (activity > 5 ? 10 : 0);
  let radiation = 0.08 + noise(0.02);

  // Inject anomalies
  if (anomalyActive.get(crewId + '_hr_high')) hr += 35;
  if (anomalyActive.get(crewId + '_hr_low')) hr -= 30;
  if (anomalyActive.get(crewId + '_bp_high')) { sysBP += 50; diaBP += 25; }
  if (anomalyActive.get(crewId + '_temp_high')) temp += 2.0;
  if (anomalyActive.get(crewId + '_spo2_low')) spo2 -= 10;
  if (anomalyActive.get(crewId + '_stress_high')) stress += 40;
  if (anomalyActive.get(crewId + '_sleep_low')) sleepQ -= 35;
  if (anomalyActive.get(crewId + '_co2_high')) co2 += 3000;
  if (anomalyActive.get(crewId + '_rad_high')) radiation += 0.6;
  if (anomalyActive.get(crewId + '_hrv_low')) hrv -= 25;

  // Random fault injection
  if (Math.random() < config.faultInjectionRate) {
    const faults = ['heartRate', 'temperature', 'spo2', 'activityLevel'];
    const fault = faults[Math.floor(Math.random() * faults.length)];
    if (fault === 'heartRate') hr = -1; // sensor fault
    if (fault === 'temperature') temp = -999;
    if (fault === 'spo2') spo2 = -1;
    if (fault === 'activityLevel') activity = -1;
  }

  return {
    timestamp: time,
    crewId,
    heartRate: Math.round(hr),
    heartRateVariability: Math.max(5, Math.round(hrv)),
    systolicBP: Math.round(sysBP),
    diastolicBP: Math.round(diaBP),
    temperature: Math.round(temp * 10) / 10,
    skinTemperature: Math.round(skinTemp * 10) / 10,
    spo2: Math.min(100, Math.max(70, Math.round(spo2))),
    activityLevel: Math.max(0, Math.min(10, Math.round(activity * 10) / 10)),
    sleepQuality: Math.max(0, Math.min(100, Math.round(sleepQ))),
    stressIndex: Math.max(0, Math.min(100, Math.round(stress))),
    co2Level: Math.max(300, Math.round(co2)),
    ambientTemp: Math.round(ambTemp * 10) / 10,
    noiseLevel: Math.max(20, Math.round(noiseLvl)),
    radiationDose: Math.max(0, Math.round(radiation * 1000) / 1000),
  };
}

// ============================================================
// STAGE 2: QUALITY CONTROL
// ============================================================
function assessQuality(reading: SensorReading): QualityFlags {
  const missing: string[] = [];
  const degraded: string[] = [];
  const faults: string[] = [];
  let score = 100;

  // Check for sensor faults (impossible values)
  if (reading.heartRate < 0 || reading.heartRate > 300) {
    faults.push('heartRate');
    score -= 30;
  }
  if (reading.temperature < 30 || reading.temperature > 45) {
    faults.push('temperature');
    score -= 30;
  }
  if (reading.spo2 < 50 || reading.spo2 > 100) {
    faults.push('spo2');
    score -= 25;
  }
  if (reading.activityLevel < 0) {
    faults.push('activityLevel');
    score -= 20;
  }

  // Check for degraded signals (borderline values)
  if (reading.heartRate > 0 && (reading.heartRate < 35 || reading.heartRate > 220)) {
    degraded.push('heartRate');
    score -= 10;
  }
  if (reading.spo2 < 85) {
    degraded.push('spo2');
    score -= 15;
  }
  if (reading.co2Level > 3000) {
    degraded.push('co2Level');
    score -= 10;
  }

  // Timestamp check
  const timestampErrors = reading.timestamp <= 0;
  if (timestampErrors) score -= 20;

  const overallQuality = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 40 ? 'degraded' : 'invalid';

  return {
    missingValues: missing,
    degradedSignals: degraded,
    timestampErrors,
    sensorFaults: faults,
    overallQuality,
    qualityScore: Math.max(0, score),
  };
}

// ============================================================
// STAGE 3: BASELINE / INDIVIDUAL REFERENCE
// ============================================================
function updateBaseline(baseline: BaselineProfile | null | undefined, reading: SensorReading, quality: QualityFlags): BaselineProfile {
  // Only update baseline with good quality data
  if (quality.qualityScore < 70) return baseline || createEmptyBaseline(reading.crewId);
  if (quality.sensorFaults.length > 0) return baseline || createEmptyBaseline(reading.crewId);

  if (!baseline) {
    return {
      crewId: reading.crewId,
      establishedAt: reading.timestamp,
      samples: 1,
      heartRate: { mean: reading.heartRate, std: 0, min: reading.heartRate, max: reading.heartRate },
      hrv: { mean: reading.heartRateVariability, std: 0 },
      systolicBP: { mean: reading.systolicBP, std: 0 },
      temperature: { mean: reading.temperature, std: 0 },
      sleepQuality: { mean: reading.sleepQuality, std: 0 },
      stressIndex: { mean: reading.stressIndex, std: 0 },
      activityLevel: { mean: reading.activityLevel, std: 0 },
      lastUpdated: reading.timestamp,
    };
  }

  const n = baseline.samples;
  const newN = n + 1;
  const alpha = 1 / Math.min(newN, 100); // Exponential moving with cap

  const updateStat = (mean: number, std: number, value: number) => {
    const newMean = mean + alpha * (value - mean);
    const newStd = std + alpha * (Math.abs(value - newMean) - std);
    return { mean: newMean, std: Math.max(newStd, 0.1) };
  };

  const hr = updateStat(baseline.heartRate.mean, baseline.heartRate.std, reading.heartRate);
  const hrv = updateStat(baseline.hrv.mean, baseline.hrv.std, reading.heartRateVariability);
  const bp = updateStat(baseline.systolicBP.mean, baseline.systolicBP.std, reading.systolicBP);
  const temp = updateStat(baseline.temperature.mean, baseline.temperature.std, reading.temperature);
  const sleep = updateStat(baseline.sleepQuality.mean, baseline.sleepQuality.std, reading.sleepQuality);
  const stress = updateStat(baseline.stressIndex.mean, baseline.stressIndex.std, reading.stressIndex);
  const act = updateStat(baseline.activityLevel.mean, baseline.activityLevel.std, reading.activityLevel);

  return {
    ...baseline,
    samples: newN,
    heartRate: { ...hr, min: Math.min(baseline.heartRate.min, reading.heartRate), max: Math.max(baseline.heartRate.max, reading.heartRate) },
    hrv,
    systolicBP: bp,
    temperature: temp,
    sleepQuality: sleep,
    stressIndex: stress,
    activityLevel: act,
    lastUpdated: reading.timestamp,
  };
}

function createEmptyBaseline(crewId: string): BaselineProfile {
  return {
    crewId,
    establishedAt: Date.now(),
    samples: 0,
    heartRate: { mean: 72, std: 8, min: 50, max: 100 },
    hrv: { mean: 45, std: 10 },
    systolicBP: { mean: 120, std: 10 },
    temperature: { mean: 36.6, std: 0.3 },
    sleepQuality: { mean: 75, std: 10 },
    stressIndex: { mean: 35, std: 10 },
    activityLevel: { mean: 4, std: 2 },
    lastUpdated: Date.now(),
  };
}

// ============================================================
// STAGE 4: ANOMALY DETECTION
// ============================================================
let anomalyCounter = 0;

function detectAnomalies(
  reading: SensorReading,
  baseline: BaselineProfile,
  quality: QualityFlags,
  history: SensorReading[]
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];
  if (quality.qualityScore < 50) return anomalies; // Don't analyze bad data

  const dataQuality = quality.qualityScore / 100;

  // Z-score based detection for each parameter
  const checks: { param: keyof SensorReading; baselineKey: keyof BaselineProfile; area: SurveillanceArea; name: string }[] = [
    { param: 'heartRate', baselineKey: 'heartRate', area: 'cardiovascular', name: 'Frecuencia cardiaca' },
    { param: 'heartRateVariability', baselineKey: 'hrv', area: 'cardiovascular', name: 'Variabilidad cardiaca (HRV)' },
    { param: 'systolicBP', baselineKey: 'systolicBP', area: 'cardiovascular', name: 'Presión arterial sistólica' },
    { param: 'temperature', baselineKey: 'temperature', area: 'immune', name: 'Temperatura corporal' },
    { param: 'sleepQuality', baselineKey: 'sleepQuality', area: 'psychological', name: 'Calidad de sueño' },
    { param: 'stressIndex', baselineKey: 'stressIndex', area: 'psychological', name: 'Índice de estrés' },
  ];

  for (const check of checks) {
    const value = reading[check.param] as number;
    const stat = baseline[check.baselineKey] as { mean: number; std: number };
    const zScore = (value - stat.mean) / stat.std;

    if (Math.abs(zScore) > 2.5) {
      const severity = Math.abs(zScore) > 4 ? 'critical' : Math.abs(zScore) > 3.5 ? 'high' : Math.abs(zScore) > 3 ? 'medium' : 'low';
      const direction = zScore > 0 ? 'elevado' : 'reducido';

      anomalies.push({
        id: `ANM-${++anomalyCounter}`,
        timestamp: reading.timestamp,
        crewId: reading.crewId,
        type: 'deviation',
        parameter: check.name,
        severity,
        description: `${check.name} ${direction}: ${value} (ref: ${stat.mean.toFixed(1)} ± ${stat.std.toFixed(1)}, z=${zScore.toFixed(2)})`,
        confidence: Math.min(0.95, Math.abs(zScore) / 5) * dataQuality,
        zScore,
        dataQuality,
        requiresHumanReview: severity === 'high' || severity === 'critical',
        area: check.area,
      });
    }
  }

  // Trend detection: check if last 5 readings show consistent direction
  if (history.length >= 5) {
    const last5 = history.slice(-5);
    const hrTrend = last5.map(r => r.heartRate);
    const allIncreasing = hrTrend.every((v, i) => i === 0 || v > hrTrend[i - 1]);
    const allDecreasing = hrTrend.every((v, i) => i === 0 || v < hrTrend[i - 1]);

    if (allIncreasing || allDecreasing) {
      const change = hrTrend[4] - hrTrend[0];
      if (Math.abs(change) > 15) {
        anomalies.push({
          id: `ANM-${++anomalyCounter}`,
          timestamp: reading.timestamp,
          crewId: reading.crewId,
          type: 'trend',
          parameter: 'Tendencia FC',
          severity: Math.abs(change) > 30 ? 'high' : 'medium',
          description: `Tendencia ${allIncreasing ? 'ascendente' : 'descendente'} en FC: ${change > 0 ? '+' : ''}${change} bpm en últimas 5 lecturas`,
          confidence: 0.7 * dataQuality,
          zScore: change / baseline.heartRate.std,
          dataQuality,
          requiresHumanReview: Math.abs(change) > 25,
          area: 'cardiovascular',
        });
      }
    }
  }

  // Environmental anomaly
  if (reading.co2Level > 2000) {
    anomalies.push({
      id: `ANM-${++anomalyCounter}`,
      timestamp: reading.timestamp,
      crewId: reading.crewId,
      type: 'contextual',
      parameter: 'CO2 ambiental',
      severity: reading.co2Level > 4000 ? 'high' : 'medium',
      description: `Nivel de CO2 elevado: ${reading.co2Level} ppm. Puede afectar cognición y bienestar.`,
      confidence: 0.85 * dataQuality,
      zScore: (reading.co2Level - 400) / 500,
      dataQuality,
      requiresHumanReview: reading.co2Level > 3000,
      area: 'environmental',
    });
  }

  return anomalies;
}

// ============================================================
// STAGE 5: INDEPENDENT SAFETY RULES
// ============================================================
let alertCounter = 0;

function checkSafetyRules(reading: SensorReading): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];

  for (const rule of SAFETY_RULES) {
    const value = reading[rule.param as keyof SensorReading] as number;
    let triggered = false;

    if (rule.direction === 'above' && value > rule.threshold) triggered = true;
    if (rule.direction === 'below' && value < rule.threshold) triggered = true;

    if (triggered) {
      alerts.push({
        id: `SAF-${++alertCounter}`,
        timestamp: reading.timestamp,
        crewId: reading.crewId,
        rule: rule.rule,
        severity: rule.severity,
        message: `${rule.rule} — Valor actual: ${value}`,
        parameter: rule.param,
        value,
        threshold: rule.threshold,
        action: rule.action,
        acknowledged: false,
      });
    }
  }

  return alerts;
}

// ============================================================
// AREA ASSESSMENTS
// ============================================================
function assessAreas(
  reading: SensorReading,
  baseline: BaselineProfile,
  quality: QualityFlags,
  anomalies: AnomalyResult[]
): AreaAssessment[] {
  const crewAnomalies = anomalies.filter(a => a.crewId === reading.crewId);

  const getAreaStatus = (area: SurveillanceArea): 'nominal' | 'watch' | 'alert' => {
    const areaAnomalies = crewAnomalies.filter(a => a.area === area);
    if (areaAnomalies.some(a => a.severity === 'critical' || a.severity === 'high')) return 'alert';
    if (areaAnomalies.some(a => a.severity === 'medium')) return 'watch';
    return 'nominal';
  };

  const getTrend = (area: SurveillanceArea): 'stable' | 'improving' | 'declining' | 'unknown' => {
    const areaAnomalies = crewAnomalies.filter(a => a.area === area);
    if (areaAnomalies.length === 0) return 'stable';
    const recent = areaAnomalies.filter(a => a.timestamp > Date.now() - 60000);
    if (recent.length > 3) return 'declining';
    if (recent.length === 0) return 'improving';
    return 'stable';
  };

  return [
    {
      area: 'cardiovascular',
      status: getAreaStatus('cardiovascular'),
      indicators: [`FC: ${reading.heartRate} bpm`, `HRV: ${reading.heartRateVariability} ms`, `PA: ${reading.systolicBP}/${reading.diastolicBP}`],
      trend: getTrend('cardiovascular'),
      lastAssessment: reading.timestamp,
      notes: quality.sensorFaults.includes('heartRate') ? '⚠ Sensor FC degradado' : '',
    },
    {
      area: 'immune',
      status: getAreaStatus('immune'),
      indicators: [`Temp: ${reading.temperature}°C`, `Temp piel: ${reading.skinTemperature}°C`, `SpO2: ${reading.spo2}%`],
      trend: getTrend('immune'),
      lastAssessment: reading.timestamp,
      notes: '',
    },
    {
      area: 'psychological',
      status: getAreaStatus('psychological'),
      indicators: [`Sueño: ${reading.sleepQuality}/100`, `Estrés: ${reading.stressIndex}/100`, `Actividad: ${reading.activityLevel}/10`],
      trend: getTrend('psychological'),
      lastAssessment: reading.timestamp,
      notes: '',
    },
    {
      area: 'environmental',
      status: getAreaStatus('environmental'),
      indicators: [`CO2: ${reading.co2Level} ppm`, `Ambiente: ${reading.ambientTemp}°C`, `Ruido: ${reading.noiseLevel} dB`, `Rad: ${reading.radiationDose} mSv/h`],
      trend: getTrend('environmental'),
      lastAssessment: reading.timestamp,
      notes: '',
    },
    {
      area: 'bone',
      status: 'nominal' as const,
      indicators: ['Marcadores: sin datos disponibles', 'Ejercicio: registrado', 'Historial: en evaluación'],
      trend: 'unknown' as const,
      lastAssessment: reading.timestamp,
      notes: 'Datos de marcadores óseos no disponibles en esta fase',
    },
  ];
}

// ============================================================
// MAIN ENGINE CLASS
// ============================================================
export class AEGISEngine {
  private config: EngineConfig;
  private state: SystemState;
  private anomalyFlags: Map<string, boolean> = new Map();
  private tickInterval: number | null = null;
  private listeners: Set<() => void> = new Set();
  private history: Map<string, SensorReading[]> = new Map();

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.state = {
      crew: INITIAL_CREW.map(c => ({ ...c })),
      currentReadings: new Map(),
      readingHistory: new Map(),
      baselines: new Map(),
      qualityFlags: new Map(),
      anomalies: [],
      safetyAlerts: [],
      areaAssessments: new Map(),
      isOnline: true,
      syncQueue: 0,
      systemTime: Date.now(),
    };

    // Initialize baselines for crew with established baselines
    for (const member of INITIAL_CREW) {
      if (member.baselineEstablished) {
        this.state.baselines.set(member.id, createEmptyBaseline(member.id));
      }
      this.history.set(member.id, []);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getState(): SystemState {
    return this.state;
  }

  getConfig(): EngineConfig {
    return this.config;
  }

  setConfig(partial: Partial<EngineConfig>) {
    this.config = { ...this.config, ...partial };
    this.notify();
  }

  toggleOnline() {
    this.state.isOnline = !this.state.isOnline;
    if (!this.state.isOnline) {
      this.state.syncQueue = 0;
    }
    this.notify();
  }

  // Inject anomaly for testing
  injectAnomaly(crewId: string, type: string) {
    const key = `${crewId}_${type}`;
    this.anomalyFlags.set(key, !this.anomalyFlags.get(key));
    this.notify();
  }

  getActiveAnomalies(): Map<string, boolean> {
    return new Map(this.anomalyFlags);
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.state.safetyAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notify();
    }
  }

  // Main processing tick
  tick() {
    this.state.systemTime = Date.now();

    for (const member of this.state.crew) {
      // Stage 1: Capture
      const reading = generateSensorReading(member.id, this.config, this.state.systemTime, this.anomalyFlags);

      // Stage 2: Quality
      const quality = assessQuality(reading);
      this.state.qualityFlags.set(member.id, quality);

      // Store reading
      this.state.currentReadings.set(member.id, reading);
      const hist = this.history.get(member.id) || [];
      hist.push(reading);
      if (hist.length > 200) hist.shift();
      this.history.set(member.id, hist);
      this.state.readingHistory.set(member.id, [...hist]);

      // Stage 3: Baseline
      const currentBaseline = this.state.baselines.get(member.id);
      if (currentBaseline || member.baselineEstablished) {
        const updated = updateBaseline(currentBaseline, reading, quality);
        this.state.baselines.set(member.id, updated);

        // Stage 4: Anomaly detection
        if (quality.qualityScore >= 50) {
          const newAnomalies = detectAnomalies(reading, updated, quality, hist);
          this.state.anomalies.push(...newAnomalies);
          if (this.state.anomalies.length > 100) {
            this.state.anomalies = this.state.anomalies.slice(-100);
          }
        }
      }

      // Stage 5: Safety rules (INDEPENDENT - runs regardless of AI)
      const safetyAlerts = checkSafetyRules(reading);
      this.state.safetyAlerts.push(...safetyAlerts);
      if (this.state.safetyAlerts.length > 50) {
        this.state.safetyAlerts = this.state.safetyAlerts.slice(-50);
      }

      // Stage 6: Area assessments
      const bl = this.state.baselines.get(member.id) ?? createEmptyBaseline(member.id);
      const areas = assessAreas(reading, bl, quality, this.state.anomalies);
      this.state.areaAssessments.set(member.id, areas);

      // Update crew status
      const crewAlerts = safetyAlerts.filter(a => a.crewId === member.id);
      const crewAnomalies = this.state.anomalies.filter(a => a.crewId === member.id && a.timestamp > Date.now() - 30000);

      if (crewAlerts.some(a => a.severity === 'critical' || a.severity === 'emergency')) {
        member.status = 'critical';
      } else if (crewAlerts.length > 0 || crewAnomalies.some(a => a.severity === 'high')) {
        member.status = 'alert';
      } else if (crewAnomalies.length > 0) {
        member.status = 'watch';
      } else {
        member.status = 'nominal';
      }
    }

    // Sync queue simulation
    if (this.state.isOnline) {
      this.state.syncQueue = Math.max(0, this.state.syncQueue - 1);
    } else {
      this.state.syncQueue += this.state.crew.length;
    }

    this.notify();
  }

  start(intervalMs: number = 2000) {
    if (this.tickInterval) return;
    this.tickInterval = window.setInterval(() => this.tick(), intervalMs);
    this.tick(); // Immediate first tick
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  getReadingHistory(crewId: string): SensorReading[] {
    return this.history.get(crewId) || [];
  }

  getRecentAnomalies(crewId?: string, limit: number = 20): AnomalyResult[] {
    let filtered = [...this.state.anomalies];
    if (crewId) filtered = filtered.filter(a => a.crewId === crewId);
    return filtered.slice(-limit).reverse();
  }

  getRecentAlerts(crewId?: string, limit: number = 20): SafetyAlert[] {
    let filtered = [...this.state.safetyAlerts];
    if (crewId) filtered = filtered.filter(a => a.crewId === crewId);
    return filtered.slice(-limit).reverse();
  }
}

// Singleton
export const aegisEngine = new AEGISEngine();
