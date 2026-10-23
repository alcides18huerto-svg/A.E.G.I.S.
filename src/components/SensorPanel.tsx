import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SensorReading, BaselineProfile, AnomalyResult, AreaAssessment } from '../engine/types';

interface Props {
  reading: SensorReading | undefined;
  baseline: BaselineProfile | undefined;
  history: SensorReading[];
  areas: AreaAssessment[];
  anomalies: AnomalyResult[];
}

export default function SensorPanel({ reading, baseline, history, areas, anomalies }: Props) {
  if (!reading) return <div className="text-slate-500">Sin datos</div>;

  // Prepare chart data
  const chartData = history.slice(-50).map((r, i) => ({
    idx: i,
    time: new Date(r.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heartRate: r.heartRate,
    hrv: r.heartRateVariability,
    systolicBP: r.systolicBP,
    temperature: r.temperature,
    spo2: r.spo2,
    stress: r.stressIndex,
    sleep: r.sleepQuality,
  }));

  const areaStatusColors = {
    nominal: 'border-emerald-500/30 bg-emerald-500/5',
    watch: 'border-amber-500/30 bg-amber-500/5',
    alert: 'border-red-500/30 bg-red-500/5',
  };

  const areaIcons: Record<string, string> = {
    cardiovascular: '❤️',
    immune: '🛡️',
    psychological: '🧠',
    environmental: '🌡️',
    bone: '🦴',
  };

  const trendIcons: Record<string, string> = {
    stable: '→',
    improving: '↗',
    declining: '↘',
    unknown: '?',
  };

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Heart Rate Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Frecuencia Cardiaca (bpm)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              {baseline && (
                <ReferenceLine y={baseline.heartRate.mean} stroke="#6366f1" strokeDasharray="5 5" label={{ value: `μ=${baseline.heartRate.mean.toFixed(0)}`, fill: '#6366f1', fontSize: 10 }} />
              )}
              <Line type="monotone" dataKey="heartRate" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Pressure Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Presión Arterial (mmHg)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              {baseline && (
                <ReferenceLine y={baseline.systolicBP.mean} stroke="#6366f1" strokeDasharray="5 5" label={{ value: `μ=${baseline.systolicBP.mean.toFixed(0)}`, fill: '#6366f1', fontSize: 10 }} />
              )}
              <Line type="monotone" dataKey="systolicBP" stroke="#f87171" strokeWidth={2} dot={false} name="Sistólica" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Temperatura Corporal (°C)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="temperature" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stress/Sleep Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Estrés y Sueño</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} dot={false} name="Estrés" />
              <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Sueño" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area assessments */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Áreas de Vigilancia</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {areas.map((area) => (
            <div key={area.area} className={`p-4 rounded-xl border ${areaStatusColors[area.status]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{areaIcons[area.area]}</span>
                <span className="text-xs font-medium text-slate-300 capitalize">{area.area === 'bone' ? 'Óseo' : area.area === 'immune' ? 'Inmunitario' : area.area === 'cardiovascular' ? 'Cardiovascular' : area.area === 'psychological' ? 'Psicológico' : 'Ambiental'}</span>
              </div>
              <div className="space-y-1">
                {area.indicators.slice(0, 3).map((ind, i) => (
                  <div key={i} className="text-xs text-slate-400 truncate">{ind}</div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <span className={area.trend === 'declining' ? 'text-red-400' : area.trend === 'improving' ? 'text-emerald-400' : 'text-slate-500'}>
                  {trendIcons[area.trend]} {area.trend === 'stable' ? 'Estable' : area.trend === 'improving' ? 'Mejora' : area.trend === 'declining' ? 'Deterioro' : 'Sin datos'}
                </span>
              </div>
              {area.notes && <div className="mt-1 text-xs text-amber-400">{area.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent anomalies */}
      {anomalies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Anomalías Detectadas (Motor IA)</h4>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div key={anomaly.id} className={`p-3 rounded-lg border ${
                anomaly.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                anomaly.severity === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                anomaly.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-slate-700 bg-slate-800/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200">{anomaly.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Confianza: {(anomaly.confidence * 100).toFixed(0)}%</span>
                    {anomaly.requiresHumanReview && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Revisión humana</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
