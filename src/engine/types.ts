// ============================================================
// A.E.G.I.S. Engine - Type Definitions
// ============================================================

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  baselineEstablished: boolean;
  baselineDays: number;
  status: 'nominal' | 'watch' | 'alert' | 'critical';
}

export interface SensorReading {
  timestamp: number;
  crewId: string;
  heartRate: number;           // bpm
  heartRateVariability: number; // ms (RMSSD)
  systolicBP: number;          // mmHg
  diastolicBP: number;         // mmHg
  temperature: number;         // °C
  skinTemperature: number;     // °C
  spo2: number;                // %
  activityLevel: number;       // 0-10
  sleepQuality: number;        // 0-100
  stressIndex: number;         // 0-100
  co2Level: number;            // ppm
  ambientTemp: number;         // °C
  noiseLevel: number;          // dB
  radiationDose: number;       // mSv/h
}

export interface QualityFlags {
  missingValues: string[];
  degradedSignals: string[];
  timestampErrors: boolean;
  sensorFaults: string[];
  overallQuality: 'excellent' | 'good' | 'degraded' | 'invalid';
  qualityScore: number; // 0-100
}

export interface BaselineProfile {
  crewId: string;
  establishedAt: number;
  samples: number;
  heartRate: { mean: number; std: number; min: number; max: number };
  hrv: { mean: number; std: number };
  systolicBP: { mean: number; std: number };
  temperature: { mean: number; std: number };
  sleepQuality: { mean: number; std: number };
  stressIndex: { mean: number; std: number };
  activityLevel: { mean: number; std: number };
  lastUpdated: number;
}

export interface AnomalyResult {
  id: string;
  timestamp: number;
  crewId: string;
  type: 'deviation' | 'trend' | 'sustained' | 'contextual';
  parameter: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;       // 0-1
  zScore: number;
  dataQuality: number;      // 0-1
  requiresHumanReview: boolean;
  area: SurveillanceArea;
}

export interface SafetyAlert {
  id: string;
  timestamp: number;
  crewId: string;
  rule: string;
  severity: 'warning' | 'critical' | 'emergency';
  message: string;
  parameter: string;
  value: number;
  threshold: number;
  action: string;
  acknowledged: boolean;
}

export type SurveillanceArea = 
  | 'immune'
  | 'bone'
  | 'cardiovascular'
  | 'psychological'
  | 'environmental';

export interface AreaAssessment {
  area: SurveillanceArea;
  status: 'nominal' | 'watch' | 'alert';
  indicators: string[];
  trend: 'stable' | 'improving' | 'declining' | 'unknown';
  lastAssessment: number;
  notes: string;
}

export interface SystemState {
  crew: CrewMember[];
  currentReadings: Map<string, SensorReading>;
  readingHistory: Map<string, SensorReading[]>;
  baselines: Map<string, BaselineProfile>;
  qualityFlags: Map<string, QualityFlags>;
  anomalies: AnomalyResult[];
  safetyAlerts: SafetyAlert[];
  areaAssessments: Map<string, AreaAssessment[]>;
  isOnline: boolean;
  syncQueue: number;
  systemTime: number;
}

export interface EngineConfig {
  simulationSpeed: number;     // multiplier for time
  sensorNoiseLevel: number;    // 0-1
  faultInjectionRate: number;  // 0-1
  anomalyProbability: number;  // 0-1
}
