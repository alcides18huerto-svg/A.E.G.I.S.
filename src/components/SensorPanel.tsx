import { useMemo } from 'react';
import { Activity, Bone, Brain, HeartPulse, Shield, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SensorReading, BaselineProfile, AreaAssessment, HazardAssessment } from '../engine/types';

interface Props {
  reading: SensorReading | undefined;
  baseline: BaselineProfile | undefined;
  history: SensorReading[];
  areas: AreaAssessment[];
  hazards?: HazardAssessment[];
}

export default function SensorPanel({ reading, baseline, history, areas, hazards = [] }: Props) {
  const chartData = useMemo(
    () =>
      history.slice(-50).map((r, i) => ({
        idx: i,
        time: new Date(r.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heartRate: r.heartRate,
        hrv: r.heartRateVariability,
        systolicBP: r.systolicBP,
        temperature: r.temperature,
        spo2: r.spo2,
        stress: r.stressIndex,
        sleep: r.sleepQuality,
        mood: r.moodIndex,
        glucose: r.bloodGlucose,
      })),
    [history],
  );

  if (!reading) return <div className="text-slate-500">Sin datos</div>;

  const areaStatusColors = {
    nominal: 'border-emerald-500/30 bg-emerald-500/5',
    watch: 'border-amber-500/30 bg-amber-500/5',
    alert: 'border-red-500/30 bg-red-500/5',
  };

  const areaIcons: Record<string, typeof HeartPulse> = {
    cardiovascular: HeartPulse,
    immune: Shield,
    psychological: Brain,
    environmental: Thermometer,
    bone: Bone,
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
        <div className="glass-panel rounded-xl p-4">
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
        <div className="glass-panel rounded-xl p-4">
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
        <div className="glass-panel rounded-xl p-4">
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

        {/* SpO2 Chart */}
        <div className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Saturación de Oxígeno (%)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={[85, 100]} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'límite 90%', fill: '#ef4444', fontSize: 9 }} />
              <Line type="monotone" dataKey="spo2" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HRV Chart */}
        <div className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Variabilidad Cardiaca HRV (ms)</h4>
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
                <ReferenceLine y={baseline.hrv.mean} stroke="#6366f1" strokeDasharray="5 5" label={{ value: `μ=${baseline.hrv.mean.toFixed(0)}`, fill: '#6366f1', fontSize: 10 }} />
              )}
              <Line type="monotone" dataKey="hrv" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stress/Sleep Chart */}
        <div className="glass-panel rounded-xl p-4">
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
              <Line type="monotone" dataKey="mood" stroke="#34d399" strokeWidth={2} dot={false} name="Ánimo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Glucose Chart */}
        <div className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Glucosa en Sangre (mg/dL)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="idx" hide />
              <YAxis domain={[60, 320]} stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <ReferenceLine y={70} stroke="#f87171" strokeDasharray="5 5" label={{ value: 'hipo 70', fill: '#f87171', fontSize: 10 }} />
              <ReferenceLine y={250} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'hiper 250', fill: '#fbbf24', fontSize: 10 }} />
              <Line type="monotone" dataKey="glucose" stroke="#fb923c" strokeWidth={2} dot={false} name="Glucosa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area assessments */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Áreas de Vigilancia</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {areas.map((area) => {
            const AreaIcon = areaIcons[area.area] ?? Activity;
            return (
              <div key={area.area} className={`p-4 rounded-xl border ${areaStatusColors[area.status]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AreaIcon size={16} className="text-slate-400" />
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
            );
          })}
        </div>
      </div>

      {/* NASA HRP - 5 Peligros de los vuelos espaciales tripulados */}
      {hazards.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Los 5 Peligros HRP — NASA Human Research Program</h4>
          <p className="text-xs text-slate-500 mb-3">Fuente: NASA HRP · 5 Hazards of Human Spaceflight (nasa.gov/human-research-program)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {hazards.map((h) => (
              <div key={h.id} className={`p-4 rounded-xl border ${h.status === 'alert' ? 'border-red-500/30 bg-red-500/5' : h.status === 'watch' ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">H{h.hazardNumber}</span>
                  <span className={`text-[10px] uppercase tracking-wide ${h.status === 'alert' ? 'text-red-400' : h.status === 'watch' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {h.status === 'alert' ? 'Alerta' : h.status === 'watch' ? 'Vigilancia' : 'Nominal'} · {h.score}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200 mb-1">{h.name}</div>
                <div className="space-y-1 mb-2">
                  {h.indicators.slice(0, 3).map((ind, i) => (
                    <div key={i} className="text-[10px] text-slate-400 leading-tight">{ind}</div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2" title={h.hrpRef}>Ref HRP: {h.dataClass === 'measured' ? 'Medido' : h.dataClass === 'estimated' ? 'Estimado' : 'Mixto'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
