import type { AnomalyResult, SafetyAlert } from '../engine/types';

interface Props {
  anomalies: AnomalyResult[];
  alerts: SafetyAlert[];
}

interface ProtocolStep {
  step: number;
  action: string;
  responsible: string;
  timeLimit: string;
  details: string;
}

interface Protocol {
  id: string;
  title: string;
  severity: string;
  trigger: string;
  steps: ProtocolStep[];
  estimatedTime: string;
}

const PROTOCOLS: Record<string, Protocol> = {
  'cardiac_critical': {
    id: 'cardiac_critical',
    title: 'Protocolo de Emergencia Cardíaca',
    severity: 'critical',
    trigger: 'FC > 180 bpm o FC < 40 bpm',
    estimatedTime: '5-10 minutos',
    steps: [
      { step: 1, action: 'Verificar consciencia y respuesta verbal', responsible: 'Médico de vuelo', timeLimit: 'Inmediato', details: 'Confirmar que el tripulante está consciente y puede responder' },
      { step: 2, action: 'Detener toda actividad física', responsible: 'Comandante', timeLimit: '1 min', details: 'Ordenar reposo absoluto. Asegurar posición segura' },
      { step: 3, action: 'Realizar ECG de 12 derivaciones', responsible: 'Médico de vuelo', timeLimit: '3 min', details: 'Conectar monitor cardíaco completo. Registrar ritmo' },
      { step: 4, action: 'Administrar oxígeno suplementario', responsible: 'Médico de vuelo', timeLimit: '3 min', details: 'Mascarilla a 4L/min si SpO2 < 95%' },
      { step: 5, action: 'Preparar kit de emergencia cardíaca', responsible: 'Médico de vuelo', timeLimit: '5 min', details: 'Verificar disponibilidad de medicamentos antiarrítmicos' },
      { step: 6, action: 'Contactar soporte médico en Tierra', responsible: 'Comunicaciones', timeLimit: '5 min', details: 'Transmitir ECG y parámetros vitales. Solicitar telemedicina' },
      { step: 7, action: 'Documentar evento y cronología', responsible: 'Médico de vuelo', timeLimit: '10 min', details: 'Registrar hora de inicio, síntomas, intervenciones' },
      { step: 8, action: 'Monitoreo continuo cada 30 segundos', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Continuo', details: 'El sistema mantiene vigilancia intensiva hasta estabilización' },
    ],
  },
  'hypertension_crisis': {
    id: 'hypertension_crisis',
    title: 'Protocolo de Crisis Hipertensiva',
    severity: 'critical',
    trigger: 'PA sistólica > 200 mmHg o diastólica > 130 mmHg',
    estimatedTime: '10-15 minutos',
    steps: [
      { step: 1, action: 'Confirmar medición con segundo dispositivo', responsible: 'Médico de vuelo', timeLimit: '2 min', details: 'Verificar que no sea error de sensor' },
      { step: 2, action: 'Evaluar síntomas neurológicos', responsible: 'Médico de vuelo', timeLimit: '3 min', details: 'Buscar signos de daño orgánico: visión, habla, movilidad' },
      { step: 3, action: 'Posición semi-sentada', responsible: 'Tripulante', timeLimit: 'Inmediato', details: 'Cabeza elevada 30-45 grados' },
      { step: 4, action: 'Ambiente tranquilo y oscuro', responsible: 'Comandante', timeLimit: '3 min', details: 'Reducir estímulos. Silencio relativo' },
      { step: 5, action: 'Administrar antihipertensivo de acción rápida', responsible: 'Médico de vuelo', timeLimit: '5 min', details: 'Según protocolo médico pre-aprobado' },
      { step: 6, action: 'Medir PA cada 5 minutos', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Continuo', details: 'Monitoreo automático con alertas si no hay mejora' },
      { step: 7, action: 'Contactar Tierra para ajuste de medicación', responsible: 'Comunicaciones', timeLimit: '10 min', details: 'Telemedicina para guía de tratamiento' },
      { step: 8, action: 'Restricción de actividades críticas', responsible: 'Comandante', timeLimit: 'Inmediato', details: 'No operar sistemas críticos hasta estabilización' },
    ],
  },
  'hypoxia': {
    id: 'hypoxia',
    title: 'Protocolo de Hipoxia',
    severity: 'critical',
    trigger: 'SpO2 < 90%',
    estimatedTime: '3-5 minutos',
    steps: [
      { step: 1, action: 'Verificar integridad del sistema de soporte vital', responsible: 'Ingeniero de sistemas', timeLimit: 'Inmediato', details: 'Revisar generadores de O2, scrubbers de CO2' },
      { step: 2, action: 'Administrar oxígeno de emergencia', responsible: 'Médico de vuelo', timeLimit: '1 min', details: 'Mascarilla con reservorio a 10L/min' },
      { step: 3, action: 'Verificar presión de cabina', responsible: 'Ingeniero de sistemas', timeLimit: '2 min', details: 'Confirmar que no hay despresurización' },
      { step: 4, action: 'Evaluar función cognitiva', responsible: 'Médico de vuelo', timeLimit: '3 min', details: 'Pruebas simples: contar hacia atrás, seguir instrucciones' },
      { step: 5, action: 'Activar sistema de O2 de respaldo', responsible: 'Ingeniero de sistemas', timeLimit: '3 min', details: 'Si SpO2 no mejora en 2 minutos' },
      { step: 6, action: 'Notificar a Tierra - prioridad máxima', responsible: 'Comunicaciones', timeLimit: '3 min', details: 'Canal de emergencia. Posible aborto de misión' },
      { step: 7, action: 'Preparar para posible EVA de rescate', responsible: 'Comandante', timeLimit: '5 min', details: 'Si el problema persiste y hay opción de retorno' },
    ],
  },
  'fever': {
    id: 'fever',
    title: 'Protocolo de Fiebre',
    severity: 'warning',
    trigger: 'Temperatura > 38.5°C',
    estimatedTime: '15-30 minutos',
    steps: [
      { step: 1, action: 'Confirmar temperatura con termómetro de contacto', responsible: 'Médico de vuelo', timeLimit: '2 min', details: 'Verificar que no sea error de sensor' },
      { step: 2, action: 'Evaluar síntomas asociados', responsible: 'Médico de vuelo', timeLimit: '5 min', details: 'Dolor de cabeza, escalofríos, fatiga, tos' },
      { step: 3, action: 'Hidratación oral forzada', responsible: 'Tripulante', timeLimit: 'Inmediato', details: 'Mínimo 500ml de agua o solución electrolítica' },
      { step: 4, action: 'Administrar antipirético', responsible: 'Médico de vuelo', timeLimit: '10 min', details: 'Paracetamol 1g según protocolo' },
      { step: 5, action: 'Reposo en zona de temperatura controlada', responsible: 'Comandante', timeLimit: 'Inmediato', details: 'Reducir carga de trabajo. Ambiente fresco' },
      { step: 6, action: 'Monitoreo cada 30 minutos', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Continuo', details: 'Temperatura, FC, síntomas' },
      { step: 7, action: 'Tomar muestras para análisis', responsible: 'Médico de vuelo', timeLimit: '30 min', details: 'Sangre, orina si fiebre persiste > 24h' },
      { step: 8, action: 'Consultar con Tierra si > 39°C', responsible: 'Comunicaciones', timeLimit: '1h', details: 'Evaluar necesidad de antibióticos o antivirales' },
    ],
  },
  'psychological_stress': {
    id: 'psychological_stress',
    title: 'Protocolo de Estrés Psicológico Elevado',
    severity: 'medium',
    trigger: 'Índice de estrés > 70/100 sostenido',
    estimatedTime: '1-2 horas',
    steps: [
      { step: 1, action: 'Entrevista confidencial', responsible: 'Médico de vuelo', timeLimit: '30 min', details: 'Evaluación de estado mental. Requiere consentimiento' },
      { step: 2, action: 'Aplicar cuestionario validado (PSS-10)', responsible: 'Médico de vuelo', timeLimit: '15 min', details: 'Escala de estrés percibido' },
      { step: 3, action: 'Identificar factores estresantes', responsible: 'Médico de vuelo', timeLimit: '30 min', details: 'Carga de trabajo, aislamiento, conflictos interpersonales' },
      { step: 4, action: 'Ajustar carga de trabajo', responsible: 'Comandante', timeLimit: '1h', details: 'Reducir tareas no críticas. Más tiempo de descanso' },
      { step: 5, action: 'Facilitar comunicación con familia', responsible: 'Comunicaciones', timeLimit: '2h', details: 'Si es apropiado y el tripulante lo desea' },
      { step: 6, action: 'Sesión de telepsicología', responsible: 'Comunicaciones', timeLimit: '24h', details: 'Con psicólogo en Tierra. Confidencial' },
      { step: 7, action: 'Técnicas de relajación guiada', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Diario', details: 'Ejercicios de respiración, meditación' },
      { step: 8, action: 'Monitoreo continuo sin vigilancia punitiva', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Continuo', details: 'Solo para apoyo, nunca para evaluación de desempeño' },
    ],
  },
  'co2_elevated': {
    id: 'co2_elevated',
    title: 'Protocolo de CO2 Elevado',
    severity: 'warning',
    trigger: 'CO2 > 2000 ppm',
    estimatedTime: '10-20 minutos',
    steps: [
      { step: 1, action: 'Verificar sensores de CO2', responsible: 'Ingeniero de sistemas', timeLimit: '2 min', details: 'Confirmar que no es fallo de sensor' },
      { step: 2, action: 'Inspeccionar scrubbers de CO2', responsible: 'Ingeniero de sistemas', timeLimit: '5 min', details: 'Revisar capacidad de absorción. Posible saturación' },
      { step: 3, action: 'Aumentar ventilación', responsible: 'Ingeniero de sistemas', timeLimit: 'Inmediato', details: 'Máximo flujo de aire fresco disponible' },
      { step: 4, action: 'Activar scrubbers de respaldo', responsible: 'Ingeniero de sistemas', timeLimit: '5 min', details: 'Si los principales no son suficientes' },
      { step: 5, action: 'Evaluar síntomas en tripulación', responsible: 'Médico de vuelo', timeLimit: '10 min', details: 'Dolor de cabeza, fatiga, dificultad para concentrarse' },
      { step: 6, action: 'Reducir actividad física', responsible: 'Comandante', timeLimit: 'Inmediato', details: 'Menor consumo de O2 y producción de CO2' },
      { step: 7, action: 'Monitoreo cada 5 minutos', responsible: 'Sistema A.E.G.I.S.', timeLimit: 'Continuo', details: 'Hasta que CO2 < 1000 ppm' },
      { step: 8, action: 'Documentar para mantenimiento', responsible: 'Ingeniero de sistemas', timeLimit: '1h', details: 'Registrar para reemplazo programado de scrubbers' },
    ],
  },
};

export default function ActionProtocol({ anomalies, alerts }: Props) {
  // Determine which protocol to show based on current alerts/anomalies
  const activeProtocol = determineActiveProtocol(alerts, anomalies);

  if (!activeProtocol) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Protocolo de Acción
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-slate-400">Sin protocolos activos</p>
          <p className="text-xs text-slate-600 mt-2">
            Los protocolos se activan automáticamente cuando se detectan anomalías críticas
          </p>
        </div>
      </div>
    );
  }

  const protocol = PROTOCOLS[activeProtocol];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            {protocol.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1">Activado: {protocol.trigger}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          protocol.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          protocol.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          Tiempo estimado: {protocol.estimatedTime}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {protocol.steps.map((step, index) => (
          <div key={step.step} className="relative">
            {/* Connector line */}
            {index < protocol.steps.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-6 bg-slate-700" />
            )}

            <div className="flex gap-4">
              {/* Step number */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-300">{step.step}</span>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-200">{step.action}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {step.responsible}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {step.timeLimit}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.details}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <p className="text-xs text-indigo-300">
          <span className="font-medium">Nota:</span> Este protocolo es una guía. El médico de vuelo tiene autoridad para adaptar los pasos según la situación clínica específica. 
          El sistema A.E.G.I.S. proporciona monitoreo continuo y alertas, pero las decisiones finales son humanas.
        </p>
      </div>
    </div>
  );
}

function determineActiveProtocol(alerts: SafetyAlert[], anomalies: AnomalyResult[]): string | null {
  // Check safety alerts first (higher priority)
  for (const alert of alerts) {
    if (alert.acknowledged) continue;
    
    if (alert.parameter === 'heartRate' && alert.severity === 'critical') {
      return 'cardiac_critical';
    }
    if ((alert.parameter === 'systolicBP' || alert.parameter === 'diastolicBP') && alert.severity === 'critical') {
      return 'hypertension_crisis';
    }
    if (alert.parameter === 'spo2' && alert.severity === 'critical') {
      return 'hypoxia';
    }
    if (alert.parameter === 'temperature' && alert.severity === 'warning') {
      return 'fever';
    }
    if (alert.parameter === 'co2Level' && alert.severity === 'warning') {
      return 'co2_elevated';
    }
  }

  // Check anomalies
  for (const anomaly of anomalies) {
    if (anomaly.area === 'psychological' && (anomaly.severity === 'medium' || anomaly.severity === 'high')) {
      return 'psychological_stress';
    }
  }

  return null;
}
