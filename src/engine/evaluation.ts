// ============================================================
// A.E.G.I.S. Evaluation Harness — Phase 5 deliverable
// Temporal split per individual (no leakage from other crew members):
//   train window: nominal stream -> builds each crew member baseline
//   test window: independent stream with injected events -> metrics
// Metrics: sensitivity, specificity, precision, F1, false alerts/hour, AUROC.
// =====================================================================

import {
  SensorReading, BaselineProfile, EngineConfig
} from './types';
import {
  generateSensorReading, assessQuality, updateBaseline, detectAnomalies
} from './aegisEngine';

const EVAL_DEFAULT_CONFIG: EngineConfig = {
  simulationSpeed: 1,
  sensorNoiseLevel: 0.1,
  faultInjectionRate: 0,
  anomalyProbability: 0,
};

export interface EvaluationConfig {
  crewIds: string[];
  trainSamples: number;
  testSamples: number;
  injectionRate: number;
  seed: number;
}

export interface ConfusionMetrics {
  tp: number; fp: number; tn: number; fn: number;
  sensitivity: number;
  specificity: number;
  precision: number;
  f1: number;
  falseAlertsPerHour: number;
  auroc: number;
}

const EVAL_INJECTIONS = ['hr_high', 'spo2_low', 'temp_high', 'stress_high', 'hrv_low', 'bp_high'];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface EvalSample {
  reading: SensorReading;
  truth: boolean;
  history: SensorReading[];
}

function buildCrewStream(crewId: string, cfg: EvaluationConfig, epochMs: number, rng: () => number) {
  const nothing = new Map<string, boolean>();
  const train: SensorReading[] = [];
  const test: EvalSample[] = [];

  for (let i = 0; i < cfg.trainSamples; i++) {
    train.push(generateSensorReading(crewId, EVAL_DEFAULT_CONFIG, epochMs + i * 480000, nothing));
  }

  let history: SensorReading[] = train.slice(-5);
  for (let i = 0; i < cfg.testSamples; i++) {
    const flags = new Map<string, boolean>();
    let truth = false;
    if (rng() < cfg.injectionRate) {
      const chosen = EVAL_INJECTIONS[Math.floor(rng() * EVAL_INJECTIONS.length)];
      flags.set(crewId + '_' + chosen, true);
      truth = true;
    }
    const reading = generateSensorReading(crewId, EVAL_DEFAULT_CONFIG, epochMs + (cfg.trainSamples + i) * 60000, flags);
    history.push(reading);
    if (history.length > 6) history.shift();
    test.push({ reading, truth, history: history.slice() });
  }
  return { train, test };
}

function blankMetrics(): ConfusionMetrics {
  return { tp: 0, fp: 0, tn: 0, fn: 0, sensitivity: 0, specificity: 0, precision: 0, f1: 0, falseAlertsPerHour: 0, auroc: 0 };
}

function finalize(m: ConfusionMetrics, samplesPerHour: number) {
  m.sensitivity = m.tp + m.fn > 0 ? m.tp / (m.tp + m.fn) : 0;
  m.specificity = m.tn + m.fp > 0 ? m.tn / (m.tn + m.fp) : 0;
  m.precision = m.tp + m.fp > 0 ? m.tp / (m.tp + m.fp) : 0;
  m.f1 = m.precision + m.sensitivity > 0 ? 2 * (m.precision * m.sensitivity) / (m.precision + m.sensitivity) : 0;
  if (samplesPerHour > 0) m.falseAlertsPerHour = m.fp / samplesPerHour;
}

function maxZScore(reading: SensorReading, baseline: BaselineProfile): number {
  const monitored: { param: keyof SensorReading; mean: number; std: number }[] = [
    { param: 'heartRate', mean: baseline.heartRate.mean, std: baseline.heartRate.std },
    { param: 'heartRateVariability', mean: baseline.hrv.mean, std: baseline.hrv.std },
    { param: 'systolicBP', mean: baseline.systolicBP.mean, std: baseline.systolicBP.std },
    { param: 'temperature', mean: baseline.temperature.mean, std: baseline.temperature.std },
    { param: 'sleepQuality', mean: baseline.sleepQuality.mean, std: baseline.sleepQuality.std },
    { param: 'stressIndex', mean: baseline.stressIndex.mean, std: baseline.stressIndex.std },
  ];
  return Math.max(...monitored.map(mv => {
    const v = reading[mv.param] as number;
    return Math.abs((v - mv.mean) / Math.max(mv.std, 1e-6));
  }));
}

function computeAuroc(test: EvalSample[], baseline: BaselineProfile): number {
  const pos: number[] = [];
  const neg: number[] = [];
  for (const s of test) {
    const score = maxZScore(s.reading, baseline);
    (s.truth ? pos : neg).push(score);
  }
  if (pos.length === 0 || neg.length === 0) return 0;
  let concordant = 0;
  for (const p of pos) {
    for (const n of neg) {
      if (p > n) concordant++;
      else if (p === n) concordant += 0.5;
    }
  }
  return concordant / (pos.length * neg.length);
}

export interface EvaluationReport {
  config: EvaluationConfig;
  perCrew: Record<string, ConfusionMetrics>;
  aggregate: ConfusionMetrics;
  note: string;
}

export function runEvaluation(cfgPartial?: Partial<EvaluationConfig>, epochMs: number = Date.now()): EvaluationReport {
  const cfg: EvaluationConfig = {
    crewIds: ['CDR-01', 'MED-02', 'ENG-03', 'SCI-04'],
    trainSamples: 150,
    testSamples: 300,
    injectionRate: 0.08,
    seed: 20261107,
    ...cfgPartial,
  };

  const perCrew: Record<string, ConfusionMetrics> = {};
  const aggregate = blankMetrics();

  for (let ci = 0; ci < cfg.crewIds.length; ci++) {
    const crewId = cfg.crewIds[ci];
    const rng = mulberry32(cfg.seed + ci * 7919);
    const epoch = epochMs + ci * 86400000;
    const { train, test } = buildCrewStream(crewId, cfg, epoch, rng);

    // ---- TRAIN: baseline from nominal window only ----
    let baseline: BaselineProfile | null = null;
    for (const r of train) {
      baseline = updateBaseline(baseline, r, assessQuality(r));
    }
    const frozen: BaselineProfile = baseline!;

    // ---- TEST: detector on frozen baseline (no leakage into test window) ----
    const m = blankMetrics();
    for (const sample of test) {
      const detected = detectAnomalies(sample.reading, frozen, assessQuality(sample.reading), sample.history)
        .some(a => a.severity !== 'info');
      if (sample.truth && detected) m.tp += 1;
      else if (sample.truth && !detected) m.fn += 1;
      else if (!sample.truth && detected) m.fp += 1;
      else m.tn += 1;
    }
    finalize(m, test.length / 60);
    m.auroc = computeAuroc(test, frozen);
    perCrew[crewId] = m;

    aggregate.tp += m.tp; aggregate.fp += m.fp; aggregate.tn += m.tn; aggregate.fn += m.fn;
  }

  finalize(aggregate, (cfg.testSamples * cfg.crewIds.length) / 60);
  let nPos = 0, nNeg = 0;
  for (const crew of cfg.crewIds) {
    nPos += perCrew[crew].tp + perCrew[crew].fn;
    nNeg += perCrew[crew].tn + perCrew[crew].fp;
  }
  const weighted: number[] = [];
  for (const crew of cfg.crewIds) {
    const mk = perCrew[crew];
    const w = (mk.tp + mk.fn + mk.tn + mk.fp) / Math.max(nPos + nNeg, 1);
    weighted.push(mk.auroc * w);
  }
  aggregate.auroc = weighted.reduce((a, b) => a + b, 0);

  return {
    config: cfg,
    perCrew,
    aggregate,
    note: 'Split temporal por individuo: baseline entrenado solo con la ventana nominal del propio tripulante; la ventana de test es independiente. El índice de confianza no es probabilidad calibrada.',
  };
}
