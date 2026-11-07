// ============================================================
// A.E.G.I.S. Engine - Scientific Thresholds with NASA traceability
// Values derived from: docs/02_FUNDAMENTACION_CIENTIFICA.md
// =====================================================================

export type DataClass = 'measured' | 'estimated' | 'recommended';

export interface ThresholdSource {
  ref: string;
  title: string;
}

export const SOURCES = {
  STD3001_V1_4030: { ref: 'NASA-STD-3001 V1 Rev C [V1 4030]', title: 'Career Space Permissible Exposure Limit (< 600 mSv)' },
  STD3001_V1_4031: { ref: 'NASA-STD-3001 V1 Rev C [V1 4031]', title: 'Short-Term SPE Limit (< 250 mSv/event)' },
  STD3001_V1_4033: { ref: 'NASA-STD-3001 V1 Rev C [V1 4033]', title: 'GCR limits 1.3 mSv/d free space / 0.9 mS/d surface' },
  STD3001_V1_ANOMALY: { ref: 'NASA-STD-3001 V1 Rev C §4.8.1 ALARA', title: 'As Low As Reasonably Achievable' },
  STD3001_V2_6004: { ref: 'NASA-STD-3001 V2 [V2 6004]', title: 'CO2 ppCO2 1-h average <= 3 mmHg (~3950 ppm @ 1 atm)' },
  OCHMO_TB_004: { ref: 'OCHMO-TB-004 Rev D', title: 'Carbon Dioxide: nominal ISS ~2500 ppm; +1 mmHg doubles headache odds (Law et al. JOEM 2014)' },
  BONE_HRP: { ref: 'HRP-F07-ERFT.R2 (2024); Lang 2004; LeBlanc 2000', title: 'Bone loss 1-1.5 %/month hip, ~0.9-1.0 %/month spine without countermeasure' },
  SLEEP_3001: { ref: 'NASA-STD-3001 V1; HRP BHP Evidence Report 2016', title: '8 h sleep opportunity required; observed ISS 6-6.5 h (Barger 2014)' },
  CLINICAL_NONFLIGHT: { ref: 'NASA flight rules / clinical terrestrial standard', title: 'Indicative operational/emergency limits (not diagnostic)' },
} as const;

export type RuleSeverity = 'warning' | 'critical' | 'emergency';

export interface SafetyRule {
  id: string;
  param: string;
  threshold: number;
  direction: 'above' | 'below';
  severity: RuleSeverity;
  rule: string;
  action: string;
  source: ThresholdSource;
  dataClass: DataClass;
}

export const SAFETY_RULES: SafetyRule[] = [
  { id: 'SR-HR-HIGH', param: 'heartRate', threshold: 180, direction: 'above', severity: 'critical', rule: 'Frecuencia cardiaca > 180 bpm', action: 'Evaluación médica inmediata. Detener actividad física.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-HR-LOW', param: 'heartRate', threshold: 40, direction: 'below', severity: 'critical', rule: 'Frecuencia cardiaca < 40 bpm', action: 'Evaluación médica urgente. Verificar consciencia.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-BP-SYS', param: 'systolicBP', threshold: 200, direction: 'above', severity: 'critical', rule: 'Presión sistólica > 200 mmHg', action: 'Alerta de crisis hipertensiva. Protocolo de emergencia.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-BP-DIA', param: 'diastolicBP', threshold: 130, direction: 'above', severity: 'critical', rule: 'Presión diastólica > 130 mmHg', action: 'Alerta de crisis hipertensiva. Protocolo de emergencia.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-TEMP-HIGH', param: 'temperature', threshold: 39.5, direction: 'above', severity: 'warning', rule: 'Temperatura corporal > 39.5°C', action: 'Controlar fiebre. Hidratación y reposo.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-SPO2', param: 'spo2', threshold: 90, direction: 'below', severity: 'critical', rule: 'SpO2 < 90%', action: 'Posible hipoxia. Verificar sistema de soporte vital.', source: SOURCES.CLINICAL_NONFLIGHT, dataClass: 'measured' },
  { id: 'SR-CO2', param: 'co2Level', threshold: 4000, direction: 'above', severity: 'warning', rule: 'CO2 1-h > 4000 ppm (~3 mmHg)', action: 'Ventilación de emergencia. Verificar scrubbers. Riesgo de cefalea (Law 2014).', source: SOURCES.STD3001_V2_6004, dataClass: 'measured' },
  { id: 'SR-CO2-WATCH', param: 'co2Level', threshold: 2500, direction: 'above', severity: 'warning', rule: 'CO2 > 2500 ppm (nominal ISS)', action: 'Iniciar vigilancia de la media 24-h. Síntomas: registrar cefalea.', source: SOURCES.OCHMO_TB_004, dataClass: 'measured' },
  { id: 'SR-RAD', param: 'radiationDose', threshold: 0.0542, direction: 'above', severity: 'warning', rule: 'Tasa de radiación > 1.3 mSv/día (GCR, espacio libre)', action: 'Revisar composición de extravehículos y actividad. ALARA: considerad refugio si se acerca a 250 mSv/evento.', source: SOURCES.STD3001_V1_4033, dataClass: 'measured' },
  { id: 'SR-SLEEP-DEBT', param: 'sleepQuality', threshold: 40, direction: 'below', severity: 'warning', rule: 'Sueño crónicamente bajo (≤6 h equivale ~40/100)', action: 'Ajustar carga de trabajo. NASA-STD-3001: 8 h de oportunidad de sueño.', source: SOURCES.SLEEP_3001, dataClass: 'measured' },
];

export interface RadiationLimits {
  careerLimitMsv: number;
  speShortTermMsv: number;
  gcrFreeSpaceMsvPerDay: number;
  gcrSurfaceMsvPerDay: number;
  nuclearTechMsvPerMissionYear: number;
}

export const RADIATION_LIMITS: RadiationLimits = {
  careerLimitMsv: 600,
  speShortTermMsv: 250,
  gcrFreeSpaceMsvPerDay: 1.3,
  gcrSurfaceMsvPerDay: 0.9,
  nuclearTechMsvPerMissionYear: 20,
};

export interface BoneLossModel {
  baselineHipPercentPerMonth: number;
  exerciseProtectiveDaysPerWeek: number;
  protectiveReductionFactor: number;
}

export const BONE_MODEL: BoneLossModel = {
  baselineHipPercentPerMonth: 1.25,
  exerciseProtectiveDaysPerWeek: 6,
  protectiveReductionFactor: 0.15,
};

