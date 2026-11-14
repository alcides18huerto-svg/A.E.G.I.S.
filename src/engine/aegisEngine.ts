// ============================================================
// A.E.G.I.S. Engine - Core Processing Engine
// Stages: Capture → Quality → Baseline → Anomaly → Safety → Interface
// ============================================================

import {
  CrewMember, SensorReading, QualityFlags, BaselineProfile,
  AnomalyResult, SafetyAlert, SystemState, EngineConfig,
  SurveillanceArea, AreaAssessment, RadiationProfile, BoneProfile,
  PipelineTelemetry, PipelineStageId, PipelineStageMetric, RiskScore, MissionEvent, HazardAssessment
} from './types';
import { SAFETY_RULES, RADIATION_LIMITS, BONE_MODEL } from './thresholds';
import { assessHazards } from './hazards';
import { buildGuidance, MedicalGuidance } from './medicalAssistant';

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

const PIPELINE_STAGE_NAMES: Record<PipelineStageId, string> = {
  capture: 'Captura',
  quality: 'Calidad',
  baseline: 'Referencia',
  anomaly: 'Anomalías',
  safety: 'Seguridad',
  interface: 'Interfaz',
};

function createPipelineTelemetry(): PipelineTelemetry {
  return {
    ticks: 0,
    tickDurationMs: 0,
    readingsProcessed: 0,
    anomaliesEmitted: 0,
    alertsEmitted: 0,
    lastTickAt: 0,
    stages: (Object.keys(PIPELINE_STAGE_NAMES) as PipelineStageId[]).map((id) => ({
      id,
      name: PIPELINE_STAGE_NAMES[id],
      status: 'idle',
      lastDurationMs: 0,
      processed: 0,
    })),
  };
}

function riskLevelOf(score: number): RiskScore['level'] {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'elevated';
  if (score >= 20) return 'watch';
  return 'nominal';
}

// ---- SAFETY RULES (Independent from AI) ----
// Thresholds now imported from thresholds.ts with NASA traceability.

// ============================================================
// STAGE 1: SENSOR DATA CAPTURE
// ============================================================
export function generateSensorReading(crewId: string, config: EngineConfig, time: number, anomalyActive: Map<string, boolean>): SensorReading {
  const crewIdx = INITIAL_CREW.findIndex(c => c.id === crewId);
  const baseHR = [72, 68, 74, 70][crewIdx];
  const baseHRV = [45, 52, 38, 48][crewIdx];
  const baseSysBP = [118, 122, 115, 120][crewIdx];
  const baseTemp = [36.6, 36.7, 36.5, 36.8][crewIdx];
  const baseSleep = [78, 82, 72, 75][crewIdx];
  const baseStress = [35, 30, 42, 38][crewIdx];
  const baseGlucose = [95, 98, 92, 100][crewIdx];
  const baseMood = [72, 78, 65, 70][crewIdx];

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
  let glucose = baseGlucose + noise(8);
  let mood = baseMood + noise(9) - (stress - baseStress) * 0.3;
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
  if (anomalyActive.get(crewId + '_glucose_high')) glucose += 170;
  if (anomalyActive.get(crewId + '_mood_low')) mood -= 40;

  // Random fault injection
  if (Math.random() < config.faultInjectionRate) {
    const faults = ['heartRate', 'temperature', 'spo2', 'activityLevel', 'bloodGlucose'];
    const fault = faults[Math.floor(Math.random() * faults.length)];
    if (fault === 'heartRate') hr = -1; // sensor fault
    if (fault === 'temperature') temp = -999;
    if (fault === 'spo2') spo2 = -1;
    if (fault === 'activityLevel') activity = -1;
    if (fault === 'bloodGlucose') glucose = -1;
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
    bloodGlucose: Math.max(0, Math.round(glucose)),
    moodIndex: Math.max(0, Math.min(100, Math.round(mood))),
    co2Level: Math.max(300, Math.round(co2)),
    ambientTemp: Math.round(ambTemp * 10) / 10,
    noiseLevel: Math.max(20, Math.round(noiseLvl)),
    radiationDose: Math.max(0, Math.round(radiation * 1000) / 1000),
  };
}

// ============================================================
// STAGE 2: QUALITY CONTROL
// ============================================================
export function assessQuality(reading: SensorReading): QualityFlags {
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
  if (reading.bloodGlucose < 0 || reading.bloodGlucose > 500) {
    faults.push('bloodGlucose');
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
export function updateBaseline(baseline: BaselineProfile | null | undefined, reading: SensorReading, quality: QualityFlags): BaselineProfile {
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
      glucose: { mean: reading.bloodGlucose, std: 0 },
      mood: { mean: reading.moodIndex, std: 0 },
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
  const glucose = updateStat(baseline.glucose.mean, baseline.glucose.std, reading.bloodGlucose);
  const mood = updateStat(baseline.mood.mean, baseline.mood.std, reading.moodIndex);
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
    glucose,
    mood,
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
    glucose: { mean: 95, std: 12 },
    mood: { mean: 72, std: 12 },
    activityLevel: { mean: 4, std: 2 },
    lastUpdated: Date.now(),
  };
}

// ============================================================
// STAGE 4: ANOMALY DETECTION
// ============================================================
let anomalyCounter = 0;

export function detectAnomalies(
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
    { param: 'bloodGlucose', baselineKey: 'glucose', area: 'cardiovascular', name: 'Glucosa en sangre' },
    { param: 'moodIndex', baselineKey: 'mood', area: 'psychological', name: 'Estado de ánimo' },
  ];

  for (const check of checks) {
    const value = reading[check.param] as number;
    const stat = baseline[check.baselineKey] as { mean: number; std: number };
    const zScore = (value - stat.mean) / stat.std;

    if (Math.abs(zScore) > 3.0) {
      const severity = Math.abs(zScore) > 4.5 ? 'critical' : Math.abs(zScore) > 4 ? 'high' : Math.abs(zScore) > 3.5 ? 'medium' : 'low';
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
        dataClass: 'estimated',
        sourceRef: 'Baseline individual A.E.G.I.S. (z-score estadístico)',
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
          dataClass: 'estimated',
          sourceRef: 'Baseline individual A.E.G.I.S. (tendencia lineal)',
        });
      }
    }
  }

  // CO2 watch/regulation referencing [V2 6004] / OCHMO-TB-004
  if (reading.co2Level > 2500) {
    const severity = reading.co2Level > 4000 ? 'high' : 'medium';
    anomalies.push({
      id: `ANM-${++anomalyCounter}`,
      timestamp: reading.timestamp,
      crewId: reading.crewId,
      type: 'contextual',
      parameter: 'CO2 ambiental',
      severity,
      description: reading.co2Level > 4000
        ? `CO2 ${reading.co2Level} ppm (>4000; límite ppCO2 1-h ≤3 mmHg ≈3950 ppm [V2 6004]). Vigilar cefalea.`
        : `CO2 ${reading.co2Level} ppm (zona nominal ISS ~2500 ppm). Vigilar media 24-h.`,
      confidence: 0.85 * dataQuality,
      zScore: (reading.co2Level - 400) / 500,
      dataQuality,
      requiresHumanReview: reading.co2Level > 3000,
      area: 'environmental',
      dataClass: 'measured' as const,
      sourceRef: 'NASA-STD-3001 V2 [V2 6004]; OCHMO-TB-004 Rev D',
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
    if (rule.id === 'SR-CO2-WATCH') continue; // evaluated as 24-h mean in tick
    const value = reading[rule.param as keyof SensorReading] as number;
    let triggered = false;

    if (rule.direction === 'above' && value > rule.threshold) triggered = true;
    if (rule.direction === 'below' && value < rule.threshold) triggered = true;

    if (triggered) {
      alerts.push({
        id: `SAF-${++alertCounter}`,
        timestamp: reading.timestamp,
        crewId: reading.crewId,
        rule: `${rule.rule} (${rule.source.ref})`,
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
// RADIATION TRACKING (NASA-STD-3001 V1 §4.8)
// ============================================================

function createRadiationProfile(crewId: string, preflightPriorMsv: number = 0): RadiationProfile {
  return {
    crewId,
    cumulativeDoseMsv: 0,
    lastDayBoundary: 0,
    preflightPriorMsv,
    dailyRateMsv: new Map(),
    speEventActiveSince: null,
    speEventAccumMsv: 0,
    maxDailyRateMsv: 0,
  };
}

function updateRadiationProfile(
  profile: RadiationProfile,
  current: SensorReading,
  previous: SensorReading | undefined,
  elapsedHours: number
): { profile: RadiationProfile; radiationAnomalies: AnomalyResult[] } {
  const p = { ...profile, dailyRateMsv: new Map(profile.dailyRateMsv) } as RadiationProfile;
  const anomalies: AnomalyResult[] = [];

  const segmentHours = previous ? elapsedHours : 0;
  if (segmentHours > 0) {
    const segmentDose = current.radiationDose * segmentHours;
    p.cumulativeDoseMsv += segmentDose;

    const dayIndex = Math.floor(current.timestamp / 86400000);
    p.dailyRateMsv.set(dayIndex, (p.dailyRateMsv.get(dayIndex) || 0) + segmentDose);

    const dayTotal = p.dailyRateMsv.get(dayIndex) || 0;
    p.maxDailyRateMsv = Math.max(p.maxDailyRateMsv, dayTotal);

    if (current.radiationDose > 1.0) {
      if (p.speEventActiveSince === null) {
        p.speEventActiveSince = current.timestamp;
        p.speEventAccumMsv = 0;
      }
      p.speEventAccumMsv += segmentDose;
    } else if (p.speEventActiveSince !== null && current.radiationDose < 0.3) {
      p.speEventActiveSince = null;
    }
  }

  const dailyAvgMsvPerDay = p.dailyRateMsv.size > 0
    ? Array.from(p.dailyRateMsv.values()).reduce((a, b) => a + b, 0) / p.dailyRateMsv.size
    : 0;

  const gcrLimit = RADIATION_LIMITS.gcrFreeSpaceMsvPerDay;
  if (dailyAvgMsvPerDay > gcrLimit) {
    anomalies.push({
      id: `ANM-${++anomalyCounter}`,
      timestamp: current.timestamp,
      crewId: current.crewId,
      type: 'contextual',
      parameter: 'Radiación GCR (dosis media diaria)',
      severity: dailyAvgMsvPerDay > gcrLimit * 1.5 ? 'high' : 'medium',
      description: `Media diaria ${dailyAvgMsvPerDay.toFixed(2)} mSv > límite GCR espacio libre ${gcrLimit} mSv/día [V1 4033].`,
      confidence: 0.9,
      zScore: (dailyAvgMsvPerDay - gcrLimit) / gcrLimit,
      dataQuality: 1,
      requiresHumanReview: true,
      area: 'environmental',
      dataClass: 'estimated',
      sourceRef: 'NASA-STD-3001 V1 Rev C [V1 4033]',
    });
  }

  if (p.speEventAccumMsv > 0) {
    const pct = (p.speEventAccumMsv / RADIATION_LIMITS.speShortTermMsv) * 100;
    if (pct >= 20) {
      anomalies.push({
        id: `ANM-${++anomalyCounter}`,
        timestamp: current.timestamp,
        crewId: current.crewId,
        type: 'contextual',
        parameter: 'Evento de Partículas Solares',
        severity: pct >= 80 ? 'critical' : pct >= 50 ? 'high' : 'medium',
        description: `EPE acumulado ${p.speEventAccumMsv.toFixed(2)} mSv (${pct.toFixed(0)}% del límite ${RADIATION_LIMITS.speShortTermMsv} mSv [V1 4031]).`,
        confidence: 0.85,
        zScore: pct / 100,
        dataQuality: 1,
        requiresHumanReview: pct >= 50,
        area: 'environmental',
        dataClass: 'estimated',
        sourceRef: 'NASA-STD-3001 V1 Rev C [V1 4031]',
      });
    }
  }

  const careerTotal = p.preflightPriorMsv + p.cumulativeDoseMsv;
  const careerPct = (careerTotal / RADIATION_LIMITS.careerLimitMsv) * 100;
  const alertThresholds: { at: number; sev: AnomalyResult['severity'] }[] = [
    { at: 60, sev: 'medium' },
    { at: 80, sev: 'high' },
    { at: 100, sev: 'critical' },
  ];
  for (const { at, sev } of alertThresholds) {
    if (careerPct >= at && !careerAlertMemo[p.crewId]?.[at]) {
      (careerAlertMemo[p.crewId] ||= {})[at] = true;
      anomalies.push({
        id: `ANM-${++anomalyCounter}`,
        timestamp: current.timestamp,
        crewId: current.crewId,
        type: 'contextual',
        parameter: 'Dosis de carrera acumulada',
        severity: sev,
        description: `Dosis total de carrera ${careerTotal.toFixed(1)} mSv (${careerPct.toFixed(0)}% del límite de 600 mSv [V1 4030]). ALARA.`,
        confidence: 1,
        zScore: careerPct / 100,
        dataQuality: 1,
        requiresHumanReview: true,
        area: 'environmental',
        dataClass: 'estimated',
        sourceRef: 'NASA-STD-3001 V1 Rev C [V1 4030]',
      });
      break;
    }
  }

  return { profile: p, radiationAnomalies: anomalies };
}

const careerAlertMemo: Record<string, Record<number, boolean>> = {};

// ============================================================
// BONE / MUSCULOSKELETAL MODEL (HRP-F07-ERFT.R2; Lang 2004)
// ============================================================

function createBoneProfile(crewId: string): BoneProfile {
  return {
    crewId,
    estimatedBmdChangePercent: 0,
    exerciseAdherentSamples: 0,
    totalSamplesConsidered: 0,
    lastUpdated: Date.now(),
  };
}

function updateBoneProfile(bone: BoneProfile | undefined, reading: SensorReading, quality: QualityFlags, elapsedHours: number): BoneProfile {
  if (quality.qualityScore < 70 || quality.sensorFaults.length > 0) return bone || createBoneProfile(reading.crewId);
  const b = bone || createBoneProfile(reading.crewId);

  const adherent = reading.activityLevel >= 5 ? 1 : 0;
  b.exerciseAdherentSamples += adherent;
  b.totalSamplesConsidered += 1;

  const adherence = b.totalSamplesConsidered > 0
    ? b.exerciseAdherentSamples / b.totalSamplesConsidered
    : 0;
  const adherenceDrive = Math.min(1, adherence / 0.35);
  const lossRatePercentPerMonth = BONE_MODEL.baselineHipPercentPerMonth * (1 - BONE_MODEL.protectiveReductionFactor * adherenceDrive);
  const monthHours = 24 * 30.44;
  b.estimatedBmdChangePercent -= lossRatePercentPerMonth * (elapsedHours / monthHours);
  b.lastUpdated = reading.timestamp;
  return b;
}
function assessAreas(
  reading: SensorReading,
  baseline: BaselineProfile,
  quality: QualityFlags,
  anomalies: AnomalyResult[],
  bone: BoneProfile,
  radiation: RadiationProfile
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

  const careerTotal = radiation.preflightPriorMsv + radiation.cumulativeDoseMsv;
  const careerPct = careerTotal / RADIATION_LIMITS.careerLimitMsv;
  const boneStatus: AreaAssessment['status'] = bone.estimatedBmdChangePercent < -6 ? 'alert' : bone.estimatedBmdChangePercent < -3.5 ? 'watch' : 'nominal';
  const boneTrend: AreaAssessment['trend'] = bone.totalSamplesConsidered < 20 ? 'unknown' : 'declining';

  return [
    {
      area: 'cardiovascular',
      status: getAreaStatus('cardiovascular'),
      indicators: [`FC: ${reading.heartRate} bpm`, `HRV: ${reading.heartRateVariability} ms`, `PA: ${reading.systolicBP}/${reading.diastolicBP}`],
      trend: getTrend('cardiovascular'),
      lastAssessment: reading.timestamp,
      dataClass: 'mixed',
      notes: quality.sensorFaults.includes('heartRate') ? '⚠ Sensor FC degradado' : '',
    },
    {
      area: 'immune',
      status: getAreaStatus('immune'),
      indicators: [`Temp: ${reading.temperature}°C`, `Temp piel: ${reading.skinTemperature}°C`, `SpO2: ${reading.spo2}%`],
      trend: getTrend('immune'),
      lastAssessment: reading.timestamp,
      dataClass: 'measured',
      notes: 'Biomarcadores sanguíneos no instrumentados (fuera de alcance)',
    },
    {
      area: 'psychological',
      status: getAreaStatus('psychological'),
      indicators: [`Sueño: ${reading.sleepQuality}/100`, `Estrés: ${reading.stressIndex}/100`, `Actividad: ${reading.activityLevel}/10`],
      trend: getTrend('psychological'),
      lastAssessment: reading.timestamp,
      dataClass: 'measured',
      notes: '',
    },
    {
      area: 'environmental',
      status: getAreaStatus('environmental'),
      indicators: ['CO2', 'Ambiente', 'Ruido', 'Radiación tasa', 'Radiación acumulada'].map((k, i) => {
        const vals = [
          `CO2: ${reading.co2Level} ppm`,
          `Ambiente: ${reading.ambientTemp}°C`,
          `Ruido: ${reading.noiseLevel} dB`,
          `Rad tasa: ${reading.radiationDose} mSv/h`,
          `Rad acumulada misión: ${radiation.cumulativeDoseMsv.toFixed(2)} mSv (${(careerPct * 100).toFixed(0)}% de 600 mSv de carrera)`,
        ];
        return vals[i];
      }),
      trend: getTrend('environmental'),
      lastAssessment: reading.timestamp,
      dataClass: 'mixed',
      notes: radiation.speEventActiveSince !== null ? `⚠ Evento EPE: +${radiation.speEventAccumMsv.toFixed(2)} mSv` : '',
    },
    {
      area: 'bone',
      status: boneStatus,
      indicators: [
        `ΔDMO estimada: ${bone.estimatedBmdChangePercent.toFixed(2)}% (hip, est.)`,
        `Adherencia ejercicio: ${bone.totalSamplesConsidered ? ((bone.exerciseAdherentSamples / bone.totalSamplesConsidered) * 100).toFixed(0) : 0}%`,
        'Referencia sin contramedida: 1-1.5 %/mes (LeBlanc 2000; Lang 2004)',
      ],
      trend: boneTrend,
      lastAssessment: reading.timestamp,
      dataClass: 'estimated',
      notes: 'DMO real solo validable por DXA pre/post-misión (HRP-F07-ERFT.R2)',
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
  private lastTickTime: number = Date.now();
  private tickCount: number = 0;
  private sustainedStreaks: Map<string, number> = new Map();

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
      hazardAssessments: new Map(),
      radiationProfiles: new Map(),
      boneProfiles: new Map(),
      riskScores: new Map(),
      pipeline: createPipelineTelemetry(),
      isOnline: true,
      syncQueue: 0,
      systemTime: Date.now(),
    };

    // Initialize baselines for crew with established baselines
    for (const member of INITIAL_CREW) {
      if (member.baselineEstablished) {
        this.state.baselines.set(member.id, createEmptyBaseline(member.id));
      }
      this.state.radiationProfiles.set(member.id, createRadiationProfile(member.id));
      this.state.boneProfiles.set(member.id, createBoneProfile(member.id));
      this.history.set(member.id, []);
    }

    this.restorePersisted();
  }

  private persist() {
    try {
      const KEY = 'aegis_profiles_v1';
      const payload = {
        savedAt: Date.now(),
        baselines: Array.from(this.state.baselines.entries()),
        radiation: Array.from(this.state.radiationProfiles.entries()).map(([id, p]) => [
          id,
          { ...p, dailyRateMsv: Array.from(p.dailyRateMsv.entries()) },
        ]),
        bone: Array.from(this.state.boneProfiles.entries()),
      };
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // storage unavailable (private mode / SSR): persistence disabled
    }
  }

  private restorePersisted() {
    try {
      const raw = window.localStorage.getItem('aegis_profiles_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      for (const [id, bl] of parsed.baselines ?? []) {
        if (this.state.baselines.has(id)) this.state.baselines.set(id, bl);
      }
      for (const [id, pr] of parsed.radiation ?? []) {
        if (this.state.radiationProfiles.has(id)) {
          const restored = { ...pr, dailyRateMsv: new Map(pr.dailyRateMsv) };
          this.state.radiationProfiles.set(id, restored);
        }
      }
      for (const [id, bone] of parsed.bone ?? []) {
        if (this.state.boneProfiles.has(id)) this.state.boneProfiles.set(id, bone);
      }
    } catch {
      // corrupted cache: ignore and rebuild
    }
  }

  resetPersistedProfiles() {
    try {
      window.localStorage.removeItem('aegis_profiles_v1');
    } catch {
      // storage unavailable
    }
    this.state.radiationProfiles.clear();
    this.state.boneProfiles.clear();
    this.state.baselines.clear();
    for (const member of this.state.crew) {
      if (member.baselineEstablished) this.state.baselines.set(member.id, createEmptyBaseline(member.id));
      this.state.radiationProfiles.set(member.id, createRadiationProfile(member.id));
      this.state.boneProfiles.set(member.id, createBoneProfile(member.id));
    }
    this.notify();
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

  // Stage 4d: sustained / persistence detection (early warning before hard limits)
  private detectSustained(reading: SensorReading, baseline: BaselineProfile, quality: QualityFlags): AnomalyResult[] {
    const out: AnomalyResult[] = [];
    if (quality.qualityScore < 70 || quality.sensorFaults.length > 0) return out;

    const params: {
      param: keyof SensorReading;
      key: 'heartRate' | 'hrv' | 'systolicBP' | 'temperature' | 'sleepQuality' | 'stressIndex' | 'glucose' | 'mood';
      name: string;
      area: SurveillanceArea;
    }[] = [
      { param: 'heartRate', key: 'heartRate', name: 'Frecuencia cardiaca', area: 'cardiovascular' },
      { param: 'heartRateVariability', key: 'hrv', name: 'HRV', area: 'cardiovascular' },
      { param: 'systolicBP', key: 'systolicBP', name: 'Presión sistólica', area: 'cardiovascular' },
      { param: 'temperature', key: 'temperature', name: 'Temperatura corporal', area: 'immune' },
      { param: 'sleepQuality', key: 'sleepQuality', name: 'Calidad de sueño', area: 'psychological' },
      { param: 'stressIndex', key: 'stressIndex', name: 'Índice de estrés', area: 'psychological' },
      { param: 'bloodGlucose', key: 'glucose', name: 'Glucosa en sangre', area: 'cardiovascular' },
      { param: 'moodIndex', key: 'mood', name: 'Estado de ánimo', area: 'psychological' },
    ];

    for (const p of params) {
      const value = reading[p.param] as number;
      const stat = baseline[p.key] as { mean: number; std: number };
      const z = (value - stat.mean) / Math.max(stat.std, 0.1);
      const key = `${reading.crewId}:${p.param}`;
      const streak = Math.abs(z) > 2 ? (this.sustainedStreaks.get(key) ?? 0) + 1 : 0;
      this.sustainedStreaks.set(key, streak);

      // Emit on first crossing of 4 consecutive samples, then every 8 to avoid flooding.
      if (streak === 4 || (streak > 4 && streak % 8 === 0)) {
        const severity: AnomalyResult['severity'] = Math.abs(z) > 4 ? 'high' : Math.abs(z) > 3 ? 'medium' : 'low';
        out.push({
          id: `ANM-${++anomalyCounter}`,
          timestamp: reading.timestamp,
          crewId: reading.crewId,
          type: 'sustained',
          parameter: `${p.name} sostenida`,
          severity,
          description: `${p.name} ${z > 0 ? 'elevada' : 'reducida'} de forma sostenida en ${streak} lecturas (z=${z.toFixed(2)}, ref ${stat.mean.toFixed(1)}±${stat.std.toFixed(1)})`,
          confidence: Math.min(0.9, Math.abs(z) / 4) * (quality.qualityScore / 100),
          zScore: z,
          dataQuality: quality.qualityScore / 100,
          requiresHumanReview: severity === 'high',
          area: p.area,
          dataClass: 'estimated',
          sourceRef: 'A.E.G.I.S. detector de persistencia (ventana móvil, 4 muestras)',
        });
      }
    }
    return out;
  }

  // Composite per-crew risk index (0 = nominal, 100 = critical)
  private computeRiskScore(
    member: CrewMember,
    reading: SensorReading,
    quality: QualityFlags,
    alerts: SafetyAlert[],
    anomalies: AnomalyResult[],
    areas: AreaAssessment[],
    radiation: RadiationProfile,
    bone: BoneProfile
  ): RiskScore {
    const now = reading.timestamp;
    const activeAlerts = alerts.filter(a => a.crewId === member.id && !a.acknowledged && a.timestamp > now - 300000);
    const recentAnomalies = anomalies.filter(a => a.crewId === member.id && a.timestamp > now - 60000);
    const drivers: string[] = [];
    let score = 0;

    for (const alert of activeAlerts) {
      if (alert.severity === 'emergency') {
        score += 40;
        drivers.push(`EMERGENCIA: ${alert.rule}`);
      } else if (alert.severity === 'critical') {
        score += 26;
        drivers.push(`Crítico: ${alert.rule}`);
      } else {
        score += 8;
      }
    }

    for (const anomaly of recentAnomalies) {
      if (anomaly.severity === 'critical') score += 20;
      else if (anomaly.severity === 'high') score += 12;
      else if (anomaly.severity === 'medium') score += 6;
      else if (anomaly.severity === 'low') score += 2;
      if (anomaly.type === 'sustained') score += 4;
      if (anomaly.requiresHumanReview && drivers.length < 4) drivers.push(anomaly.parameter);
    }

    const areaAlerts = areas.filter(a => a.status === 'alert');
    const areaWatches = areas.filter(a => a.status === 'watch');
    score += areaAlerts.length * 10 + areaWatches.length * 4;
    if (areaAlerts.length > 0 && drivers.length < 4) drivers.push(`Área en alerta: ${areaAlerts[0].area}`);
    else if (areaWatches.length > 0 && drivers.length < 4) drivers.push(`Área en vigilancia: ${areaWatches[0].area}`);

    score += Math.max(0, 100 - quality.qualityScore) * 0.2;

    const careerPct = ((radiation.preflightPriorMsv + radiation.cumulativeDoseMsv) / RADIATION_LIMITS.careerLimitMsv) * 100;
    score += careerPct * 0.15;
    if (careerPct >= 60 && drivers.length < 4) drivers.push(`Dosis de carrera ${careerPct.toFixed(0)}%`);

    score += Math.min(20, Math.abs(Math.min(0, bone.estimatedBmdChangePercent)) * 2.5);

    const clamped = Math.round(Math.max(0, Math.min(100, score)));
    return {
      crewId: member.id,
      score: clamped,
      level: riskLevelOf(clamped),
      drivers: drivers.slice(0, 4),
    };
  }

  // Main processing tick
  tick() {
    const tickStart = performance.now();
    const now = Date.now();
    const elapsedHours = Math.max(0, Math.min(24 * 30.44, (now - this.lastTickTime) / 3600000));
    this.lastTickTime = now;
    this.state.systemTime = now;

    let captureMs = 0, qualityMs = 0, baselineMs = 0, anomalyMs = 0, safetyMs = 0, interfaceMs = 0;
    let anomaliesThisTick = 0, alertsThisTick = 0;
    let worstQuality = 100;
    let hasQualityFault = false;
    let hasCriticalAlert = false;

    for (const member of this.state.crew) {
      // Stage 1: Capture
      const tCapture = performance.now();
      const reading = generateSensorReading(member.id, this.config, this.state.systemTime, this.anomalyFlags);
      captureMs += performance.now() - tCapture;

      // Stage 2: Quality
      const tQuality = performance.now();
      const quality = assessQuality(reading);
      this.state.qualityFlags.set(member.id, quality);
      qualityMs += performance.now() - tQuality;
      worstQuality = Math.min(worstQuality, quality.qualityScore);
      if (quality.overallQuality === 'invalid') hasQualityFault = true;

      // Store reading
      const hist = this.history.get(member.id) || [];
      const previous = hist[hist.length - 1];
      hist.push(reading);
      if (hist.length > 200) hist.shift();
      this.history.set(member.id, hist);
      this.state.currentReadings.set(member.id, reading);
      this.state.readingHistory.set(member.id, [...hist]);

      // Stage 3: Baseline
      const tBaseline = performance.now();
      let updated = this.state.baselines.get(member.id);
      const currentBaseline = updated;
      if (currentBaseline || member.baselineEstablished) {
        updated = updateBaseline(currentBaseline, reading, quality);
        this.state.baselines.set(member.id, updated);
      }
      baselineMs += performance.now() - tBaseline;

      // Stage 4: Anomaly detection (statistical + persistence)
      const tAnomaly = performance.now();
      if (updated && quality.qualityScore >= 50) {
        const newAnomalies = detectAnomalies(reading, updated, quality, hist);
        const sustained = quality.qualityScore >= 70 ? this.detectSustained(reading, updated, quality) : [];
        const combined = [...newAnomalies, ...sustained];
        this.state.anomalies.push(...combined);
        anomaliesThisTick += combined.length;
        if (this.state.anomalies.length > 100) {
          this.state.anomalies = this.state.anomalies.slice(-120);
        }
      }
      anomalyMs += performance.now() - tAnomaly;

      // Stage 4b: Radiation dose integration + limits [V1 4030/4031/4033]
      const radProfile = this.state.radiationProfiles.get(member.id) || createRadiationProfile(member.id);
      const { profile: updatedRadiation, radiationAnomalies } = updateRadiationProfile(radProfile, reading, previous, elapsedHours);
      this.state.radiationProfiles.set(member.id, updatedRadiation);
      this.state.anomalies.push(...radiationAnomalies);
      anomaliesThisTick += radiationAnomalies.length;

      // Stage 4c: Bone model (HRP-F07-ERFT.R2)
      const bone = updateBoneProfile(this.state.boneProfiles.get(member.id), reading, quality, elapsedHours);
      this.state.boneProfiles.set(member.id, bone);

      // Stage 5: Safety rules (INDEPENDENT - runs regardless of AI)
      const tSafety = performance.now();
      const safetyAlerts = checkSafetyRules(reading);
      this.state.safetyAlerts.push(...safetyAlerts);
      alertsThisTick += safetyAlerts.length;
      if (safetyAlerts.some(a => a.severity === 'critical' || a.severity === 'emergency')) hasCriticalAlert = true;
      if (this.state.safetyAlerts.length > 50) {
        this.state.safetyAlerts = this.state.safetyAlerts.slice(-50);
      }
      safetyMs += performance.now() - tSafety;

      // Stage 6: Area assessments + composite risk
      const tInterface = performance.now();
      const bl = this.state.baselines.get(member.id) ?? createEmptyBaseline(member.id);
      const areas = assessAreas(reading, bl, quality, this.state.anomalies, bone, updatedRadiation);
      this.state.areaAssessments.set(member.id, areas);
      this.state.hazardAssessments.set(
        member.id,
        assessHazards(reading, updatedRadiation, bone, areas, this.state.safetyAlerts.filter(a => a.crewId === member.id), this.state.isOnline, this.state.syncQueue)
      );
      this.state.riskScores.set(
        member.id,
        this.computeRiskScore(member, reading, quality, this.state.safetyAlerts, this.state.anomalies, areas, updatedRadiation, bone)
      );

      // Update crew status
      const crewAlerts = safetyAlerts.filter(a => a.crewId === member.id);
      const crewAnomalies = this.state.anomalies.filter(a => a.crewId === member.id && a.timestamp > now - 30000);

      if (crewAlerts.some(a => a.severity === 'critical' || a.severity === 'emergency')) {
        member.status = 'critical';
      } else if (crewAlerts.length > 0 || crewAnomalies.some(a => a.severity === 'high')) {
        member.status = 'alert';
      } else if (crewAnomalies.length > 0) {
        member.status = 'watch';
      } else {
        member.status = 'nominal';
      }
      interfaceMs += performance.now() - tInterface;
    }

    // Sync queue simulation
    if (this.state.isOnline) {
      this.state.syncQueue = Math.max(0, this.state.syncQueue - 1);
    } else {
      this.state.syncQueue += this.state.crew.length;
    }

    // Pipeline telemetry (system blocks observability)
    const p = this.state.pipeline;
    const durations: Record<PipelineStageId, number> = {
      capture: captureMs,
      quality: qualityMs,
      baseline: baselineMs,
      anomaly: anomalyMs,
      safety: safetyMs,
      interface: interfaceMs,
    };
    const statuses: Record<PipelineStageId, PipelineStageMetric['status']> = {
      capture: 'ok',
      quality: hasQualityFault ? 'fault' : worstQuality < 70 ? 'degraded' : 'ok',
      baseline: 'ok',
      anomaly: anomaliesThisTick > 0 ? 'degraded' : 'ok',
      safety: hasCriticalAlert ? 'fault' : alertsThisTick > 0 ? 'degraded' : 'ok',
      interface: 'ok',
    };
    p.ticks += 1;
    p.lastTickAt = now;
    p.tickDurationMs = Math.round((performance.now() - tickStart) * 100) / 100;
    p.readingsProcessed += this.state.crew.length;
    p.anomaliesEmitted += anomaliesThisTick;
    p.alertsEmitted += alertsThisTick;
    p.stages = p.stages.map(stage => ({
      ...stage,
      status: statuses[stage.id],
      lastDurationMs: Math.round(durations[stage.id] * 100) / 100,
      processed: stage.processed + this.state.crew.length,
    }));

    if (++this.tickCount % 30 === 0) this.persist();
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

  getRadiationProfile(crewId: string): RadiationProfile {
    return this.state.radiationProfiles.get(crewId) || createRadiationProfile(crewId);
  }

  getBoneProfile(crewId: string): BoneProfile {
    return this.state.boneProfiles.get(crewId) || createBoneProfile(crewId);
  }

  getMedicalGuidance(crewId?: string): MedicalGuidance | null {
    const target = crewId || this.state.crew[0]?.id;
    if (!target) return null;
    return buildGuidance(
      target,
      this.getRecentAlerts(target, 25),
      this.getRecentAnomalies(target, 25),
      this.getRadiationProfile(target),
      this.getBoneProfile(target)
    );
  }

  getRiskScore(crewId: string): RiskScore {
    return this.state.riskScores.get(crewId) ?? {
      crewId,
      score: 0,
      level: 'nominal',
      drivers: [],
    };
  }

  // Unified chronological feed of safety alerts + AI anomalies
  getMissionEvents(crewId?: string, limit: number = 40): MissionEvent[] {
    const events: MissionEvent[] = [];
    for (const alert of this.state.safetyAlerts) {
      if (crewId && alert.crewId !== crewId) continue;
      events.push({
        id: alert.id,
        timestamp: alert.timestamp,
        crewId: alert.crewId,
        kind: 'alert',
        severity: alert.severity,
        title: alert.rule,
        detail: alert.message,
        acknowledged: alert.acknowledged,
      });
    }
    for (const anomaly of this.state.anomalies) {
      if (crewId && anomaly.crewId !== crewId) continue;
      events.push({
        id: anomaly.id,
        timestamp: anomaly.timestamp,
        crewId: anomaly.crewId,
        kind: 'anomaly',
        severity: anomaly.severity,
        title: anomaly.parameter,
        detail: anomaly.description,
        acknowledged: false,
      });
    }
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  // Exportable mission snapshot (JSON) for post-flight analysis / audit
  exportReport(): string {
    const payload = {
      system: 'A.E.G.I.S.',
      generatedAt: new Date().toISOString(),
      crew: this.state.crew,
      pipeline: this.state.pipeline,
      riskScores: Array.from(this.state.riskScores.entries()),
      baselines: Array.from(this.state.baselines.entries()),
      hazards: Array.from(this.state.hazardAssessments.entries()),
      radiation: Array.from(this.state.radiationProfiles.entries()).map(([id, profile]) => ({
        ...profile,
        dailyRateMsv: Array.from(profile.dailyRateMsv.entries()),
      })),
      bone: Array.from(this.state.boneProfiles.entries()),
      recentAlerts: this.state.safetyAlerts.slice(-50),
      recentAnomalies: this.state.anomalies.slice(-50),
    };
    return JSON.stringify(payload, null, 2);
  }
}

// Singleton
export const aegisEngine = new AEGISEngine();
