// ============================================================
// A.E.G.I.S. - NASA Human Research Program (HRP)
// 5 Peligros de los vuelos espaciales tripulados
// Fuente: NASA HRP - "5 Hazards of Human Spaceflight"
// (www.nasa.gov/human-research-program/5-hazards-of-human-spaceflight/)
// ============================================================

import type {
  SensorReading, RadiationProfile, BoneProfile, AreaAssessment,
  SafetyAlert, SurveillanceArea, HazardAssessment,
} from './types';
import { RADIATION_LIMITS } from './thresholds';

export type HrpHazardId =
  | 'space-radiation'
  | 'isolation-confinement'
  | 'distance-from-earth'
  | 'gravity-fields'
  | 'hostile-environments';

export const HRP_HAZARDS_META: Record<HrpHazardId, { hazardNumber: number; name: string; hrpRef: string; linkedAreas: SurveillanceArea[] }> = {
  'space-radiation': {
    hazardNumber: 1,
    name: 'Radiación espacial',
    hrpRef: 'NASA HRP — Riesgo de síndromes agudos, cáncer y SNC por radiación (GCR/SPE); límites NASA-STD-3001 V1 [V1 4030/4031/4033]',
    linkedAreas: ['environmental', 'immune', 'bone'],
  },
  'isolation-confinement': {
    hazardNumber: 2,
    name: 'Aislamiento y confinamiento',
    hrpRef: 'NASA HRP — Riesgo conductual y desempeño: estrés, sueño, cohesión de tripulación (HRP BHP Evidence Report; NASA-STD-3001: oportunidad de sueño 8 h)',
    linkedAreas: ['psychological'],
  },
  'distance-from-earth': {
    hazardNumber: 3,
    name: 'Distancia de la Tierra',
    hrpRef: 'NASA HRP — Comunicación con señal diferida; autonomía médica, sin evacuación inmediata; la tripulación debe auto-gestionar emergencias (HRP: distancia/autonomía operativa)',
    linkedAreas: ['psychological', 'environmental'],
  },
  'gravity-fields': {
    hazardNumber: 4,
    name: 'Campos gravitatorios (microgravedad)',
    hrpRef: 'NASA HRP — Pérdida ósea ~1-1.5 %/mes cadera (HRP-F07-ERFT.R2), desacondicionamiento cardiovascular, cambios de fluidos cefálicos (SANS)',
    linkedAreas: ['bone', 'cardiovascular'],
  },
  'hostile-environments': {
    hazardNumber: 5,
    name: 'Ambientes hostiles / cerrados',
    hrpRef: 'NASA HRP — Ambiente cerrado de la nave: ppCO2 ≤ 3 mmHg (NASA-STD-3001 V2 [V2 6004]), radiación atrapada, ruido, temperatura; nominal ISS ~2500 ppm CO2 (OCHMO-TB-004)',
    linkedAreas: ['environmental', 'immune'],
  },
};

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

function statusOf(score: number): HazardAssessment['status'] {
  if (score >= 55) return 'alert';
  if (score >= 25) return 'watch';
  return 'nominal';
}

// Evalúa los 5 peligros HRP para un tripulante a partir de sensores
// medidos/estimados y perfiles acumulados. Todo es inferencia operacional,
// no diagnóstico clínico.
export function assessHazards(
  reading: SensorReading,
  radiation: RadiationProfile,
  bone: BoneProfile,
  areas: AreaAssessment[],
  recentAlerts: SafetyAlert[],
  isOnline: boolean,
  syncQueue: number,
): HazardAssessment[] {
  const areaStatus = (a: SurveillanceArea) => areas.find(x => x.area === a)?.status ?? 'nominal';
  const areaMax = (list: SurveillanceArea[]) =>
    list.reduce((acc, a) => Math.max(acc, areaStatus(a) === 'alert' ? 60 : areaStatus(a) === 'watch' ? 30 : 0), 0);

  const out: HazardAssessment[] = [];

  // --- H1 · Radiación espacial ---
  {
    const careerPct = ((radiation.preflightPriorMsv + radiation.cumulativeDoseMsv) / RADIATION_LIMITS.careerLimitMsv) * 100;
    const spePct = radiation.speEventActiveSince !== null ? (radiation.speEventAccumMsv / RADIATION_LIMITS.speShortTermMsv) * 100 : 0;
    const ratePct = Math.min(100, (reading.radiationDose / RADIATION_LIMITS.gcrFreeSpaceMsvPerDay) * 100);
    const score = clamp(careerPct * 0.5 + spePct * 0.8 + ratePct * 0.3 + areaMax(['environmental']) * 0.4);
    const indicators = [
      `Dosis carrera: ${(radiation.preflightPriorMsv + radiation.cumulativeDoseMsv).toFixed(1)} / ${RADIATION_LIMITS.careerLimitMsv} mSv (${careerPct.toFixed(0)}%)`,
      `Tasa actual: ${reading.radiationDose.toFixed(4)} mSv/h`,
    ];
    if (radiation.speEventActiveSince !== null) indicators.push(`Evento SPE en curso: ${radiation.speEventAccumMsv.toFixed(1)} mSv acumulados`);
    out.push({
      id: 'space-radiation', ...HRP_HAZARDS_META['space-radiation'],
      status: statusOf(score), score: Math.round(score), indicators,
      countermeasure: 'ALARA: limitar EVA, usar refugio con blindaje durante SPE, dosimetría personal continua.',
      dataClass: 'measured',
    });
  }

  // --- H2 · Aislamiento y confinamiento ---
  {
    const psych = areaStatus('psychological');
    const score = clamp(
      (psych === 'alert' ? 55 : psych === 'watch' ? 30 : 0)
      + Math.max(0, reading.stressIndex - 55) * 0.7
      + Math.max(0, 60 - reading.sleepQuality) * 0.5
      + Math.max(0, reading.noiseLevel - 70) * 0.4
    );
    const indicators = [
      `Índice de estrés: ${reading.stressIndex.toFixed(0)}/100`,
      `Calidad de sueño: ${reading.sleepQuality.toFixed(0)}/100`,
      `Ruido ambiental: ${reading.noiseLevel.toFixed(0)} dB`,
    ];
    out.push({
      id: 'isolation-confinement', ...HRP_HAZARDS_META['isolation-confinement'],
      status: statusOf(score), score: Math.round(score), indicators,
      countermeasure: 'Rotación de descanso protegida (8 h), ejercicio programado, comunicación familiar/superficie, seguimiento psicológico.',
      dataClass: 'measured',
    });
  }

  // --- H3 · Distancia de la Tierra ---
  {
    // Proxy operacional: pérdida de enlace / cola de sincronización = latencia y
    // autonomía. Sin sensor dedicado: medición estimada, no directa.
    const linkPenalty = isOnline ? 0 : 35 + Math.min(40, syncQueue * 2);
    const score = clamp(linkPenalty + (recentAlerts.some(a => !a.acknowledged && a.severity === 'critical') ? 20 : 0));
    const indicators = [
      isOnline ? 'Enlace con Tierra nominal' : `Enlace DEGRADADO · cola de sync ${syncQueue}`,
      'Latencia señal: minutos-horas (no en tiempo real)',
    ];
    out.push({
      id: 'distance-from-earth', ...HRP_HAZARDS_META['distance-from-earth'],
      status: statusOf(score), score: Math.round(score), indicators,
      countermeasure: 'Autonomía médica a bordo: ecografía guiada por IA, protocolos de tripulación, telemedicina diferida, kit de estabilización.',
      dataClass: 'estimated',
    });
  }

  // --- H4 · Campos gravitatorios (microgravedad) ---
  {
    const boneLoss = Math.abs(Math.min(0, bone.estimatedBmdChangePercent));
    const boneScore = boneLoss * 9; // ~6% pérdida ≈ puntuación severa
    const cardio = areaStatus('cardiovascular');
    const score = clamp(
      boneScore
      + (cardio === 'alert' ? 40 : cardio === 'watch' ? 20 : 0)
      + Math.max(0, 60 - reading.activityLevel * 10) * 0.25
    );
    const indicators = [
      `Pérdida estimada DMO: ${boneLoss.toFixed(1)}% (cadera, acumulada)`,
      `TA ${reading.systolicBP.toFixed(0)}/${reading.diastolicBP.toFixed(0)} mmHg · FC ${reading.heartRate.toFixed(0)} bpm`,
      `Nivel de actividad: ${reading.activityLevel.toFixed(1)}/10`,
    ];
    out.push({
      id: 'gravity-fields', ...HRP_HAZARDS_META['gravity-fields'],
      status: statusOf(score), score: Math.round(score), indicators,
      countermeasure: 'Ejercicio resistivo + aeróbico ≥6 días/semana (ARED), carga en traje, bisfosfonatos según protocolo HRP, vuelo parabólico pre/post.',
      dataClass: 'mixed',
    });
  }

  // --- H5 · Ambientes hostiles / cerrados ---
  {
    const co2Pct = clamp((reading.co2Level / 4000) * 100);
    const envAlert = areaStatus('environmental');
    const envScore = envAlert === 'alert' ? 55 : envAlert === 'watch' ? 30 : 0;
    const noiseScore = Math.max(0, reading.noiseLevel - 70) * 0.6;
    const tempScore = Math.abs(reading.ambientTemp - 22) > 6 ? 20 : 0;
    const score = clamp(co2Pct * 0.6 + envScore + noiseScore + tempScore);
    const indicators = [
      `ppCO2 proxy: ${reading.co2Level.toFixed(0)} ppm (límite 1-h: 4000 ppm / ~3 mmHg)`,
      `T ambiente: ${reading.ambientTemp.toFixed(1)} °C · Ruido: ${reading.noiseLevel.toFixed(0)} dB`,
    ];
    out.push({
      id: 'hostile-environments', ...HRP_HAZARDS_META['hostile-environments'],
      status: statusOf(score), score: Math.round(score), indicators,
      countermeasure: 'Scrubbers CO2 verificados, ventilación activa, control de ruido (<70 dB áreas de descanso), monitoreo continuo de atmósfera.',
      dataClass: 'measured',
    });
  }

  return out;
}
