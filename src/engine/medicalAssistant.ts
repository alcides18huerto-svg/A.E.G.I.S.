// ============================================================
// A.E.G.I.S. Autonomous Medical Assistant — Phase 6
// Triage engine: findings -> prioritized structured guidance
// All outputs are class 'recommended' (labels per docs/02 §1).
// Steps tagged: needsCommunication (ground link) vs offline-capable.
// =====================================================================

import type { AnomalyResult, SafetyAlert, RadiationProfile, BoneProfile } from './types';
import { RADIATION_LIMITS } from './thresholds';

export interface GuidedStep {
  n: number;
  action: string;
  role: string;
  deadline: string;
  needsCommunication: boolean;
  detail: string;
}

export interface MedicalGuidance {
  crewId: string;
  priority: number;                                              // 1 (highest) .. 5
  protocolId: string;
  title: string;
  severity: 'emergency' | 'critical' | 'warning' | 'info';
  trigger: string;                                               // finding + NASA source
  findings: string[];
  steps: GuidedStep[];
  offlineRecommendation: string;                                 // action when no ground link
  dataClass: 'recommended';
  disclaimer: string;
}

const DISCLAIMER = 'Guía de apoyo a decisiones, NO un diagnóstico. El médico de vuelo adapta los pasos; las decisiones finales son humanas.';

export function buildGuidance(
  crewId: string,
  alerts: SafetyAlert[],
  anomalies: AnomalyResult[],
  radiation: RadiationProfile,
  bone: BoneProfile
): MedicalGuidance | null {
  const findings: string[] = [];
  const unack = alerts.filter(a => !a.acknowledged);

  const has = (param: string, severity: string) =>
    unack.some(a => a.parameter === param && a.severity === severity);

  const hypoxia = has('spo2', 'critical');
  const cardiac = has('heartRate', 'critical');
  const bpCrisis = has('systolicBP', 'critical') || has('diastolicBP', 'critical');
  const fever = has('temperature', 'warning');
  const co2High = has('co2Level', 'warning');
  const sleepDebt = has('sleepQuality', 'warning');

  const speCritical = radiation.speEventActiveSince !== null &&
    radiation.speEventAccumMsv >= RADIATION_LIMITS.speShortTermMsv * 0.5;
  const careerHigh = radiation.preflightPriorMsv + radiation.cumulativeDoseMsv >= RADIATION_LIMITS.careerLimitMsv * 0.8;
  const boneRisk = bone.estimatedBmdChangePercent < -6;

  const stressAnomaly = anomalies.some(a =>
    a.crewId === crewId && a.area === 'psychological' && (a.severity === 'high' || a.severity === 'medium'));

  // ---- Triage decision tree (priority descends) ----
  if (speCritical) return radiationSPE(crewId, radiation, priorityOf(false), findings, [hypoxia, cardiac, bpCrisis]);
  if (hypoxia) return hypoxiaProtocol(crewId, unack, findings, co2High);
  if (cardiac) return cardiacProtocol(crewId, unack, findings);
  if (bpCrisis) return hypertensionProtocol(crewId, unack, findings);
  if (fever) return feverProtocol(crewId, unack, findings);
  if (co2High) return co2Protocol(crewId, unack, findings);
  if (careerHigh) return radiationCareer(crewId, radiation, findings);
  if (boneRisk) return boneCountermeasure(crewId, bone, findings);
  if (sleepDebt || stressAnomaly) return behavioralProtocol(crewId, unack, anomalies, findings, !!sleepDebt);
  return null;
}

function priorityOf(isEmergency: boolean): number { return isEmergency ? 1 : 2; }

function severityFrom(hasCritical: boolean): MedicalGuidance['severity'] {
  return hasCritical ? 'critical' : 'warning';
}

// ---- individual protocols ----

function radiationSPE(crewId: string, rad: RadiationProfile, _p: number, findings: string[], others: boolean[]): MedicalGuidance {
  const pct = (rad.speEventAccumMsv / RADIATION_LIMITS.speShortTermMsv) * 100;
  return {
    crewId,
    priority: 1,
    protocolId: 'spe_shelter',
    title: 'Protocolo de Refugio por Evento de Partículas Solares (EPE)',
    severity: pct >= 80 ? 'emergency' : 'critical',
    trigger: `EPE acumulado ${rad.speEventAccumMsv.toFixed(1)} mSv (${pct.toFixed(0)}% del límite de 250 mSv por evento) — [V1 4031]`,
    findings: [
      ...findings,
      `Dosis en misión: ${rad.cumulativeDoseMsv.toFixed(2)} mSv (contribuye a los 600 mSv de carrera [V1 4030])`,
      others.some(Boolean)
        ? 'Signos vitales críticos concurrentes: priorizar refugio con soporte de vitales'
        : 'Sin deterioros críticos concurrentes en tiempo real',
    ],
    steps: [
      { n: 1, action: 'Trasladar a la zona de mayor blindaje disponible', role: 'Comandante', deadline: 'Inmediato', needsCommunication: false, detail: 'Comparar mapas de protección de los módulos' },
      { n: 2, action: 'Suspender toda EVA y actividad extravehicular', role: 'Comandante', deadline: 'Inmediato', needsCommunication: false, detail: 'ALARA: [V1 4029]' },
      { n: 3, action: 'Verificar estado de conciencia/orientación de la tripulación', role: 'Médico de vuelo', deadline: '5 min', needsCommunication: false, detail: 'Test simple de atención antes de tareas de alto riesgo' },
      { n: 4, action: 'Transmitir reporte de evento a Tierra', role: 'Comunicaciones', deadline: '10 min', needsCommunication: true, detail: 'Si no hay enlace, registrar en bitácora para la próxima ventana' },
      { n: 5, action: 'Reintegración por dosis acumulada cada ciclo de 24 h', role: 'Sistema A.E.G.I.S.', deadline: 'Continuo', needsCommunication: false, detail: 'Integración [V1 4030]/[V1 4031]' },
      { n: 6, action: 'Reactivar tareas solo si <80% del límite del evento', role: 'Comandante', deadline: 'Continuo', needsCommunication: false, detail: 'Umbral de retención ALARA' },
    ],
    offlineRecommendation: 'No continuar EVA; refugio en la zona de mayor protegencia y registro de dosis acumulada en bitácora para transferir en la próxima ventana de enlace.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function radiationCareer(crewId: string, rad: RadiationProfile, findings: string[]): MedicalGuidance {
  const total = rad.preflightPriorMsv + rad.cumulativeDoseMsv;
  const pct = total / RADIATION_LIMITS.careerLimitMsv;
  return {
    crewId,
    priority: 3,
    protocolId: 'radiation_career',
    title: 'Alerta de dosis de carrera acumulada',
    severity: pct >= 1 ? 'critical' : 'warning',
    trigger: `Dosis de carrera ${total.toFixed(1)} mSv (${(pct * 100).toFixed(0)}% del límite 600 mSv) [V1 4030]`,
    findings: [...findings, 'ALARA: [V1 4029]'],
    steps: [
      { n: 1, action: 'Revisar planificación de EVA y actividades de alta exposición', role: 'Médico de vuelo', deadline: '24h', needsCommunication: true, detail: 'Ajustar reasignación de tareas con los planificadores de misión' },
      { n: 2, action: 'Confirmar cálculo de dosis con datos de dosímetros pasivos', role: 'Médico de vuelo', deadline: '24h', needsCommunication: false, detail: 'Contrastar con dosimetría interna y externa' },
      { n: 3, action: 'Informar al astronauta del estado de su dosis individual', role: 'Médico de vuelo', deadline: '24h', needsCommunication: false, detail: 'Comunicación transparente del riesgo — [V2 6095]' },
      { n: 4, action: 'Documentar en historia de salud', role: 'Médico de vuelo', deadline: '48h', needsCommunication: true, detail: 'Registre dose in career record for future missions' },
    ],
    offlineRecommendation: 'Continuar bajo restricción de exposición y considerar las prioridades de misión con ALARA hasta la próxima ventana de comunicación.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function hypoxiaProtocol(crewId: string, alerts: SafetyAlert[], findings: string[], co2High: boolean): MedicalGuidance {
  const alert = alerts.find(a => a.parameter === 'spo2');
  return {
    crewId,
    priority: 1,
    protocolId: 'hypoxia',
    title: 'Protocolo de Hipoxia',
    severity: 'critical',
    trigger: `${alert?.rule ?? 'SpO2 < 90%'} — consenso clínico; revisar fuente ambiental ${co2High ? 'y CO2 elevado [V2 6004]' : ''}`,
    findings: [...findings, ...(co2High ? ['CO2 ambiental elevado: causa ambiental candidata'] : [])],
    steps: [
      { n: 1, action: 'Verificar integridad del sistema de soporte vital', role: 'Ingeniero de sistemas', deadline: 'Inmediato', needsCommunication: false, detail: 'Generadores de O2, scrubbers de CO2' },
      { n: 2, action: 'Administrar oxígeno de emergencia', role: 'Médico de vuelo', deadline: '1 min', needsCommunication: false, detail: 'Mascarilla con reservorio 10 L/min' },
      { n: 3, action: 'Verificar presión de cabina', role: 'Ingeniero de sistemas', deadline: '2 min', needsCommunication: false, detail: 'Descartar despresurización' },
      { n: 4, action: 'Evaluar función cognitiva', role: 'Médico de vuelo', deadline: '3 min', needsCommunication: false, detail: 'Cuenta atrás desde 100 de 7 en 7; seguir órdenes simples' },
      { n: 5, action: 'Activar sistema de O2 de respaldo si no mejora', role: 'Ingeniero de sistemas', deadline: '3 min', needsCommunication: false, detail: 'SpO2 sin mejoría en 2 min' },
      { n: 6, action: 'Notificar a Tierra (prioridad máxima)', role: 'Comunicaciones', deadline: '3 min', needsCommunication: true, detail: 'Canal de emergencia; evaluar aborto de misión' },
      { n: 7, action: 'Preparar contingencia de rescate/motivo de retorno', role: 'Comandante', deadline: '5 min', needsCommunication: true, detail: 'Si el problema persiste' },
    ],
    offlineRecommendation: 'O2 de emergencia + verificación de soporte vital y presión; declarar condición de emergencia interna; registrar evolución para transmisión en la próxima ventana.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function cardiacProtocol(crewId: string, alerts: SafetyAlert[], findings: string[]): MedicalGuidance {
  const alert = alerts.find(a => a.parameter === 'heartRate');
  return {
    crewId,
    priority: 2,
    protocolId: 'cardiac_critical',
    title: 'Protocolo de Emergencia Cardíaca',
    severity: 'critical',
    trigger: `${alert?.rule ?? 'FC límitrofe'} — límite operacional fuera del rango de seguro (indicativo, no diagnóstico)`,
    findings: [...findings],
    steps: [
      { n: 1, action: 'Verificar consciencia y respuesta verbal', role: 'Médico de vuelo', deadline: 'Inmediato', needsCommunication: false, detail: 'Confirmar estado neurológico básico' },
      { n: 2, action: 'Detener toda actividad física', role: 'Comandante', deadline: '1 min', needsCommunication: false, detail: 'Reposo absoluto; posición segura' },
      { n: 3, action: 'Realizar ECG de 12 derivaciones', role: 'Médico de vuelo', deadline: '3 min', needsCommunication: false, detail: 'Conectar monitor; registrar ritmo' },
      { n: 4, action: 'Oxígeno suplementario si SpO2 < 95%', role: 'Médico de vuelo', deadline: '3 min', needsCommunication: false, detail: 'Mascarilla 4 L/min' },
      { n: 5, action: 'Preparar kit de emergencia cardíaca', role: 'Médico de vuelo', deadline: '5 min', needsCommunication: false, detail: 'Antiarrítmicos por protocolo' },
      { n: 6, action: 'Transmitir ECG y constantes a soporte médico Tierra', role: 'Comunicaciones', deadline: '5 min', needsCommunication: true, detail: 'Solicitar telemedicina' },
      { n: 7, action: 'Documentar evento y cronología', role: 'Médico de vuelo', deadline: '10 min', needsCommunication: false, detail: 'Inicio, síntomas, intervenciones' },
      { n: 8, action: 'Vigilancia intensiva hasta estabilización', role: 'Sistema A.E.G.I.S.', deadline: 'Continuo', needsCommunication: false, detail: 'Monitoreo cada 30 s' },
    ],
    offlineRecommendation: 'Reposo absoluto, O2 si están disponibles, ECG local y vigilancia intensiva; guardar registro completo para ventanas de transmisión.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function hypertensionProtocol(crewId: string, alerts: SafetyAlert[], findings: string[]): MedicalGuidance {
  const alert = alerts.find(a => a.parameter === 'systolicBP' || a.parameter === 'diastolicBP');
  return {
    crewId,
    priority: 3,
    protocolId: 'hypertension_crisis',
    title: 'Protocolo de Crisis Hipertensiva',
    severity: 'critical',
    trigger: `${alert?.rule ?? 'PA > 200/130 mmHg'} — límite clínico indicativo (no diagnóstico)`,
    findings: [...findings],
    steps: [
      { n: 1, action: 'Confirmar medición con segundo dispositivo', role: 'Médico de vuelo', deadline: '2 min', needsCommunication: false, detail: 'Descartar error de sensor' },
      { n: 2, action: 'Evaluar síntomas neurológicos', role: 'Médico de vuelo', deadline: '3 min', needsCommunication: false, detail: 'Visión, habla, movilidad' },
      { n: 3, action: 'Posición semi-sentada', role: 'Tripulante', deadline: 'Inmediato', needsCommunication: false, detail: 'Cabeza 30–45°' },
      { n: 4, action: 'Ambiente tranquilo y oscuro', role: 'Comandante', deadline: '3 min', needsCommunication: false, detail: 'Reducir estímulos' },
      { n: 5, action: 'Antihipertensivo de acción rápida', role: 'Médico de vuelo', deadline: '5 min', needsCommunication: false, detail: 'Protocolo médico pre-aprobado' },
      { n: 6, action: 'Medir PA cada 5 min', role: 'Sistema A.E.G.I.S.', deadline: 'Continuo', needsCommunication: false, detail: 'Alertas automáticas si no mejora' },
      { n: 7, action: 'Restricción de actividades críticas', role: 'Comandante', deadline: 'Inmediato', needsCommunication: false, detail: 'No operar sistemas críticos' },
      { n: 8, action: 'Solicitar ajuste de medicación desde Tierra', role: 'Comunicaciones', deadline: '10 min', needsCommunication: true, detail: 'Telemedicina' },
    ],
    offlineRecommendation: 'Reposo, ambiente controlado y PA programada; restricción de tareas operativas críticas hasta estabilización.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function feverProtocol(crewId: string, alerts: SafetyAlert[], findings: string[]): MedicalGuidance {
  const alert = alerts.find(a => a.parameter === 'temperature');
  return {
    crewId,
    priority: 4,
    protocolId: 'fever',
    title: 'Protocolo de Fiebre',
    severity: 'warning',
    trigger: `${alert?.rule ?? 'Temperatura > 38.5°C'} — criterio clínico indicativo; biomarcadores sanguíneos no instrumentados a bordo`,
    findings: [...findings],
    steps: [
      { n: 1, action: 'Confirmar temperatura con termómetro de contacto', role: 'Médico de vuelo', deadline: '2 min', needsCommunication: false, detail: 'Descartar error de sensor' },
      { n: 2, action: 'Evaluar síntomas asociados', role: 'Médico de vuelo', deadline: '5 min', needsCommunication: false, detail: 'Cefalea, escalofríos, fatiga, tos' },
      { n: 3, action: 'Hidratación oral forzada', role: 'Tripulante', deadline: 'Inmediato', needsCommunication: false, detail: '≥500 ml agua o solución electrolítica' },
      { n: 4, action: 'Antipirético según protocolo', role: 'Médico de vuelo', deadline: '10 min', needsCommunication: false, detail: 'Paracetamol 1 g' },
      { n: 5, action: 'Reposo en zona fresca', role: 'Comandante', deadline: 'Inmediato', needsCommunication: false, detail: 'Reducir carga de trabajo' },
      { n: 6, action: 'Si persiste >24h: muestras y consulta Tierra', role: 'Médico de vuelo', deadline: '24h', needsCommunication: true, detail: 'Evaluación antibióticos/antivirales' },
      { n: 7, action: 'Monitoreo cada 30 min', role: 'Sistema A.E.G.I.S.', deadline: 'Continuo', needsCommunication: false, detail: 'Temperatura, FC, síntomas' },
    ],
    offlineRecommendation: 'Aislamiento preventivo, hidratación, antipirético y bitácora de evolución cada 30 min; consulta diferida a próxima ventana.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function co2Protocol(crewId: string, alerts: SafetyAlert[], findings: string[]): MedicalGuidance {
  const alert = alerts.find(a => a.parameter === 'co2Level');
  return {
    crewId,
    priority: 3,
    protocolId: 'co2_elevated',
    title: 'Protocolo de CO2 Elevado',
    severity: 'warning',
    trigger: `${alert?.rule ?? 'CO2 > 4000 ppm'} — [V2 6004] ppCO2 1-h ≤ 3 mmHg; cefalea duplica riesgo por +1 mmHg (Law 2014)`,
    findings: [...findings],
    steps: [
      { n: 1, action: 'Verificar sensores de CO2', role: 'Ingeniero de sistemas', deadline: '2 min', needsCommunication: false, detail: 'Descartar fallo de sensor' },
      { n: 2, action: 'Inspeccionar scrubbers de CO2', role: 'Ingeniero de sistemas', deadline: '5 min', needsCommunication: false, detail: 'Capacidad/saturación' },
      { n: 3, action: 'Aumentar ventilación', role: 'Ingeniero de sistemas', deadline: 'Inmediato', needsCommunication: false, detail: 'Máximo flujo disponible' },
      { n: 4, action: 'Activar scrubbers de respaldo', role: 'Ingeniero de sistemas', deadline: '5 min', needsCommunication: false, detail: 'Si los principales no bastan' },
      { n: 5, action: 'Evaluar cefalea/fatiga en tripulación', role: 'Médico de vuelo', deadline: '10 min', needsCommunication: false, detail: 'Asociación CO2-cefalea (Law 2014)' },
      { n: 6, action: 'Reducir actividad física', role: 'Comandante', deadline: 'Inmediato', needsCommunication: false, detail: 'Menor producción de CO2' },
      { n: 7, action: 'Monitoreo cada 5 min hasta <2500 ppm', role: 'Sistema A.E.G.I.S.', deadline: 'Continuo', needsCommunication: false, detail: 'Zona nominal ISS ~2500 ppm' },
    ],
    offlineRecommendation: 'Máxima ventilación, restricción de actividad y esperar el descenso del nivel antes de reactivar tareas cognitivas finas.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function behavioralProtocol(crewId: string, alerts: SafetyAlert[], anomalies: AnomalyResult[], findings: string[], sleep: boolean): MedicalGuidance {
  const sleepAlert = alerts.find(a => a.parameter === 'sleepQuality');
  return {
    crewId,
    priority: 5,
    protocolId: 'behavioral_health',
    title: sleep ? 'Protocolo de Déficit de Sueño' : 'Protocolo de Estrés Psicológico Elevado',
    severity: 'warning' as const,
    trigger: sleep
      ? `${sleepAlert?.rule ?? 'Sueño crónicamente bajo'} — NASA-STD-3001: 8 h de oportunidad de sueño; en ISS media real 6–6.5 h (Barger 2014)`
      : 'Índice de estrés/anomalía conductual sostenida — HRP BHP Evidence Report',
    findings: [
      ...findings,
      'El desempeño tras 7 días con ≤6 h equivale a 24–36 h de vigilia (OCHMO-TB-041)',
    ],
    steps: [
      { n: 1, action: 'Revisar y estabilizar horario de sueño', role: 'Médico de vuelo', deadline: '24h', needsCommunication: false, detail: 'Periodo nominal preferente (phase delay > advance, Flynn-Evans 2023)' },
      { n: 2, action: 'Ajustar carga de trabajo', role: 'Comandante', deadline: '24h', needsCommunication: false, detail: 'Reducir tareas no críticas; límite >60 h/semana [3001 V1]' },
      { n: 3, action: 'Higiene ambiental del sueño', role: 'Ingeniero de sistemas', deadline: '24h', needsCommunication: false, detail: 'Ruido, luz, temperatura en límites [V2 7007-7077]' },
      { n: 4, action: 'Comunicación con familia si el tripulante lo desea', role: 'Comunicaciones', deadline: '48h', needsCommunication: true, detail: 'Apoyo conductual' },
      { n: 5, action: 'Evaluación confidencial con Psicología de Tierra', role: 'Comunicaciones', deadline: '72h', needsCommunication: true, detail: 'Telepsicología confidencial' },
      { n: 6, action: 'Registro autónomo de estado de ánimo y fatiga', role: 'Tripulante', deadline: 'Diario', needsCommunication: false, detail: 'Diario interno (offline)' },
      { n: 7, action: 'Verificar recuperación respecto al baseline individual', role: 'Sistema A.E.G.I.S.', deadline: '30 min', needsCommunication: false, detail: 'Reevaluación tras el descanso' },
    ],
    offlineRecommendation: sleep
      ? 'Priorizar programación del sueño (bloque nominal), ajustar carga de trabajo y registrar autoevaluación diaria offline.'
      : 'Técnicas de regulación autónoma, carga reducida y registro de estado de ánimo; evaluación diferida a próxima ventana.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

function boneCountermeasure(crewId: string, bone: BoneProfile, findings: string[]): MedicalGuidance {
  return {
    crewId,
    priority: 4,
    protocolId: 'bone_countermeasure',
    title: 'Protocolo de Contramedida Musculoesquelética',
    severity: 'warning',
    trigger: `ΔDMO estimada ${bone.estimatedBmdChangePercent.toFixed(1)}% (referencia sin contramedida: 1–1.5 %/mes — LeBlanc 2000; Lang 2004; HRP-F07-ERFT.R2)`,
    findings: [
      ...findings,
      'Estimación: la DMO real solo se valida con DXA pre/post-misión (HRP-F07-ERFT.R2)',
    ],
    steps: [
      { n: 1, action: 'Confirmar ajuste del programa resistivo (frecuencia y carga)', role: 'Médico de vuelo', deadline: '24h', needsCommunication: false, detail: '6 sesiones/semana muestra efectos protectores [OCHMO-MTB-013]' },
      { n: 2, action: 'Reforzar calcio y vitamina D según plan nutricional', role: 'Médico de vuelo', deadline: '48h', needsCommunication: false, detail: 'Coordinar con perfil nutricional' },
      { n: 3, action: 'Evitar cargas máximas transitorias de impacto', role: 'Comandante', deadline: 'Para tareas', needsCommunication: false, detail: 'El riesgo de fractura por sobrecarga es el criterio principal HRP' },
      { n: 4, action: 'Registrar adherencia diaria en el sistema', role: 'Tripulante', deadline: 'Diario', needsCommunication: false, detail: 'El modelo usa adherencia para estimar la tendencia' },
      { n: 5, action: 'Solicitar plan de DXA-acelerado al aterrizaje', role: 'Médico de vuelo', deadline: 'Aterrizaje', needsCommunication: true, detail: 'Validación post-misión' },
    ],
    offlineRecommendation: 'Mantener/aumentar sesiones de ejercicio resistivo y registrar adherencia; evitar tareas de alto impacto hasta revisión.',
    dataClass: 'recommended',
    disclaimer: DISCLAIMER,
  };
}

