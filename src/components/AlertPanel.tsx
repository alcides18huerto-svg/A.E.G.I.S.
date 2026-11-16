import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Eye, Siren, Zap } from 'lucide-react';
import type { SafetyAlert, AnomalyResult } from '../engine/types';
import { useI18n } from '../i18n/LanguageContext';

interface Props {
  alerts: SafetyAlert[];
  anomalies: AnomalyResult[];
  onAcknowledge: (id: string) => void;
}

type AlertFilter = 'all' | 'active' | 'acknowledged';

const AREA_LABEL_ES: Record<string, string> = {
  cardiovascular: 'Cardiovascular',
  immune: 'Inmunitario',
  psychological: 'Psicológico',
  environmental: 'Ambiental',
  bone: 'Óseo',
};

export default function AlertPanel({ alerts, anomalies, onAcknowledge }: Props) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<AlertFilter>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const activeCount = alerts.filter(a => !a.acknowledged).length;
  const ackCount = alerts.length - activeCount;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === 'active' && alert.acknowledged) return false;
      if (filter === 'acknowledged' && !alert.acknowledged) return false;
      if (severityFilter === 'critical' && alert.severity === 'warning') return false;
      if (severityFilter === 'warning' && alert.severity !== 'warning') return false;
      return true;
    });
  }, [alerts, filter, severityFilter]);

  const severityColors = {
    emergency: 'border-red-500 bg-red-500/10',
    critical: 'border-red-400 bg-red-500/5',
    warning: 'border-amber-400 bg-amber-500/5',
  };

  const severityIcons = {
    emergency: Siren,
    critical: AlertTriangle,
    warning: Zap,
  };

  const SeverityIcon = ({ severity }: { severity: SafetyAlert['severity'] }) => {
    const Icon = severityIcons[severity];
    return (
      <Icon
        size={20}
        className={
          severity === 'emergency' ? 'text-red-400' : severity === 'critical' ? 'text-red-300' : 'text-amber-300'
        }
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Safety alerts (independent rules) */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {t('Reglas de Seguridad Independientes')}
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            {t('No dependen de IA')}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => alerts.filter(a => !a.acknowledged).forEach(a => onAcknowledge(a.id))}
              className="ml-auto rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700"
            >
              {t('Reconocer todas ({n})', { n: activeCount })}
            </button>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
            {([
              { id: 'active', label: 'Activas', count: activeCount },
              { id: 'acknowledged', label: 'Reconocidas', count: ackCount },
              { id: 'all', label: 'Todas', count: alerts.length },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  filter === item.id ? 'bg-sky-500/25 text-sky-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t(item.label)} <span className="text-slate-500">{item.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
            {([
              { id: 'all', label: 'Toda severidad' },
              { id: 'critical', label: 'Críticas' },
              { id: 'warning', label: 'Avisos' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeverityFilter(item.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  severityFilter === item.id ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-slate-400">{t('Sin alertas que coincidan con el filtro')}</p>
            <p className="text-xs text-slate-600 mt-1">{t('Las reglas clínicas operan de forma independiente al motor predictivo')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <SeverityIcon severity={alert.severity} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${
                        alert.severity === 'emergency' ? 'text-red-400' :
                        alert.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
                      }`}>
                        {alert.severity === 'emergency' ? t('Emergencia') : alert.severity === 'critical' ? t('Crítico') : t('Aviso')}
                      </span>
                      <span className="text-xs text-slate-600">{alert.id}</span>
                      {alert.acknowledged && <span className="text-xs text-emerald-400">✓ {t('Reconocida')}</span>}
                    </div>
                    <p className="text-sm text-slate-200 font-medium">{t(alert.rule)}</p>
                    <p className="text-sm text-slate-400 mt-1">{t(alert.message)}</p>
                    <div className="mt-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700">
                      <p className="text-xs text-cyan-300">
                        <span className="font-medium">{t('Acción requerida:')}</span> {t(alert.action)}
                      </p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition-colors"
                    >
                      {t('Reconocer')}
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
            {t('Anomalías del Motor Predictivo')}
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {t('Requiere revisión humana')}
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel text-center">
            <BarChart3 size={28} className="mx-auto mb-2 text-cyan-400" />
            <p className="text-slate-400">{t('Sin anomalías detectadas')}</p>
            <p className="text-xs text-slate-600 mt-1">{t('El motor de IA compara con la referencia individual')}</p>
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
                        anomaly.type === 'sustained' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {anomaly.type === 'deviation' ? t('Desviación') : anomaly.type === 'trend' ? t('Tendencia') : anomaly.type === 'sustained' ? t('Persistente') : t('Contextual')}
                      </span>
                      <span className="text-xs text-slate-500">{t(AREA_LABEL_ES[anomaly.area] ?? anomaly.area)}</span>
                    </div>
                    <p className="text-sm text-slate-300">{t(anomaly.description)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t('Confianza')}</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-400"
                          style={{ width: `${anomaly.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t('Calidad')}</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${anomaly.dataQuality * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{(anomaly.dataQuality * 100).toFixed(0)}%</span>
                    </div>
                    {anomaly.requiresHumanReview && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-400">
                        <Eye size={12} /> {t('Revisión requerida')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
        <h5 className="text-sm font-medium text-sky-300 mb-2">{t('Diferencia entre alertas y anomalías')}</h5>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <p className="font-medium text-red-300 mb-1">{t('Reglas de Seguridad (independientes)')}</p>
            <p>{t('Se activan automáticamente cuando se superan umbrales clínicos. No dependen de la IA. Respuesta inmediata sin esperar análisis.')}</p>
          </div>
          <div>
            <p className="font-medium text-purple-300 mb-1">{t('Anomalías (motor predictivo)')}</p>
            <p>{t('Detectan desviaciones del patrón individual. Incluyen estimación de confianza y calidad de datos. Siempre requieren revisión humana.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
