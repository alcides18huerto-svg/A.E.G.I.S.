import type { SafetyAlert, AnomalyResult } from '../engine/types';

interface Props {
  alerts: SafetyAlert[];
  anomalies: AnomalyResult[];
  onAcknowledge: (id: string) => void;
}

export default function AlertPanel({ alerts, anomalies, onAcknowledge }: Props) {
  const severityColors = {
    emergency: 'border-red-500 bg-red-500/10',
    critical: 'border-red-400 bg-red-500/5',
    warning: 'border-amber-400 bg-amber-500/5',
  };

  const severityIcons = {
    emergency: '🚨',
    critical: '⚠️',
    warning: '⚡',
  };

  return (
    <div className="space-y-6">
      {/* Safety alerts (independent rules) */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Reglas de Seguridad Independientes
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            No dependen de IA
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-slate-400">Sin alertas de seguridad activas</p>
            <p className="text-xs text-slate-600 mt-1">Las reglas clínicas operan de forma independiente al motor predictivo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{severityIcons[alert.severity]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${
                        alert.severity === 'emergency' ? 'text-red-400' :
                        alert.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
                      }`}>
                        {alert.severity === 'emergency' ? 'Emergencia' : alert.severity === 'critical' ? 'Crítico' : 'Aviso'}
                      </span>
                      <span className="text-xs text-slate-600">{alert.id}</span>
                      {alert.acknowledged && <span className="text-xs text-emerald-400">✓ Reconocida</span>}
                    </div>
                    <p className="text-sm text-slate-200 font-medium">{alert.rule}</p>
                    <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                    <div className="mt-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700">
                      <p className="text-xs text-cyan-300">
                        <span className="font-medium">Acción requerida:</span> {alert.action}
                      </p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition-colors"
                    >
                      Reconocer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Anomalies */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Anomalías del Motor Predictivo
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Requiere revisión humana
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-slate-400">Sin anomalías detectadas</p>
            <p className="text-xs text-slate-600 mt-1">El motor de IA compara con la referencia individual</p>
          </div>
        ) : (
          <div className="space-y-2">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className={`p-3 rounded-lg border ${
                anomaly.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                anomaly.severity === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                anomaly.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-slate-700 bg-slate-800/30'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        anomaly.type === 'deviation' ? 'bg-blue-500/20 text-blue-300' :
                        anomaly.type === 'trend' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {anomaly.type === 'deviation' ? 'Desviación' : anomaly.type === 'trend' ? 'Tendencia' : 'Contextual'}
                      </span>
                      <span className="text-xs text-slate-500">{anomaly.area}</span>
                    </div>
                    <p className="text-sm text-slate-300">{anomaly.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Confianza</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-400"
                          style={{ width: `${anomaly.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Calidad</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${anomaly.dataQuality * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{(anomaly.dataQuality * 100).toFixed(0)}%</span>
                    </div>
                    {anomaly.requiresHumanReview && (
                      <span className="text-xs text-purple-400">👁 Revisión requerida</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <h5 className="text-sm font-medium text-indigo-300 mb-2">Diferencia entre alertas y anomalías</h5>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <p className="font-medium text-red-300 mb-1">Reglas de Seguridad (independientes)</p>
            <p>Se activan automáticamente cuando se superan umbrales clínicos. No dependen de la IA. Respuesta inmediata sin esperar análisis.</p>
          </div>
          <div>
            <p className="font-medium text-purple-300 mb-1">Anomalías (motor predictivo)</p>
            <p>Detectan desviaciones del patrón individual. Incluyen estimación de confianza y calidad de datos. Siempre requieren revisión humana.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
