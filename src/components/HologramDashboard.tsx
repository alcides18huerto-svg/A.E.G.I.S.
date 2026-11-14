import type { AnomalyResult, CrewMember, RiskScore, SafetyAlert, SensorReading } from '../engine/types';
import HumanBody from './HumanBody';
import ActionProtocol from './ActionProtocol';

interface Props {
  crewId: string;
  member: CrewMember | undefined;
  reading: SensorReading | undefined;
  risk: RiskScore | undefined;
  anomalies: AnomalyResult[];
  alerts: SafetyAlert[];
}

const STATUS_STYLE: Record<CrewMember['status'], { badge: string; label: string }> = {
  nominal: { badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', label: 'Nominal' },
  watch: { badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30', label: 'Observación' },
  alert: { badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30', label: 'Alerta' },
  critical: { badge: 'bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse', label: 'Crítico' },
};

const RISK_LEVEL_LABEL: Record<RiskScore['level'], string> = {
  nominal: 'Nominal',
  watch: 'Vigilancia',
  elevated: 'Elevado',
  critical: 'Crítico',
};

const RISK_TONE: Record<RiskScore['level'], string> = {
  nominal: 'text-emerald-300',
  watch: 'text-amber-300',
  elevated: 'text-orange-300',
  critical: 'text-red-300',
};

const SEVERITY_ORDER: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const SEVERITY_LABEL: Record<string, string> = {
  info: 'Info',
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
};

const AREA_LABEL: Record<string, string> = {
  cardiovascular: 'Cardiovascular',
  immune: 'Inmunitario',
  psychological: 'Psicológico',
  environmental: 'Ambiental',
  bone: 'Óseo',
};

export default function HologramDashboard({ crewId, member, reading, risk, anomalies, alerts }: Props) {
  const activeAnomalies = anomalies.filter((anomaly) => anomaly.severity !== 'info');

  const areaSummary = new Map<string, { count: number; severity: string }>();
  activeAnomalies.forEach((anomaly) => {
    const current = areaSummary.get(anomaly.area);
    if (!current) {
      areaSummary.set(anomaly.area, { count: 1, severity: anomaly.severity });
    } else {
      current.count += 1;
      if (SEVERITY_ORDER[anomaly.severity] > SEVERITY_ORDER[current.severity]) {
        current.severity = anomaly.severity;
      }
    }
  });

  const status = member ? STATUS_STYLE[member.status] : STATUS_STYLE.nominal;

  const stats = [
    {
      label: 'Frecuencia cardiaca',
      value: reading ? `${reading.heartRate}` : '—',
      unit: 'bpm',
      tone: 'text-cyan-300',
    },
    {
      label: 'Presión arterial',
      value: reading ? `${reading.systolicBP}/${reading.diastolicBP}` : '—',
      unit: 'mmHg',
      tone: 'text-rose-300',
    },
    {
      label: 'Temperatura',
      value: reading ? `${reading.temperature}` : '—',
      unit: '°C',
      tone: 'text-amber-300',
    },
    {
      label: 'Saturación O2',
      value: reading ? `${reading.spo2}` : '—',
      unit: '%',
      tone: 'text-emerald-300',
    },
    {
      label: 'Variabilidad HRV',
      value: reading ? `${reading.heartRateVariability}` : '—',
      unit: 'ms',
      tone: 'text-violet-300',
    },
    {
      label: 'Riesgo compuesto',
      value: risk ? `${risk.score}` : '—',
      unit: '/100',
      tone: risk ? RISK_TONE[risk.level] : 'text-slate-300',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-technical text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
              Sujeto biométrico seleccionado
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{member?.name ?? 'Sin tripulante'}</h2>
            <p className="text-sm text-slate-400">
              {member?.role ?? '—'} · <span className="font-mono text-xs">{member?.id ?? '—'}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${status.badge}`}>{status.label}</span>
            <span className="font-technical rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-400">
              {member?.baselineEstablished
                ? `Baseline ${member.baselineDays} d`
                : 'Baseline en curso'}
            </span>
            {risk && (
              <span className="font-technical rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-400">
                {RISK_LEVEL_LABEL[risk.level]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-4">
            <div className="font-technical mb-2 text-[10px] uppercase tracking-wider text-slate-400">
              {stat.label}
            </div>
            <div className={`text-2xl font-bold leading-none ${stat.tone}`}>
              {stat.value} <span className="text-xs font-normal text-slate-500">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <HumanBody reading={reading} anomalies={anomalies} alerts={alerts} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActionProtocol crewId={crewId} />
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-technical mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
            <span className="text-cyan-300" aria-hidden="true">◈</span>
            Perfil de riesgo
          </h3>

          <div className="space-y-2">
            {areaSummary.size === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-xs text-emerald-300">Sin áreas en observación</p>
                <p className="mt-1 text-[11px] text-slate-500">Todos los sistemas dentro de parámetros.</p>
              </div>
            ) : (
              Array.from(areaSummary.entries()).map(([area, data]) => (
                <div
                  key={area}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="block truncate text-sm text-slate-200">{AREA_LABEL[area] ?? area}</span>
                    <span className="text-[11px] text-slate-500">{data.count} hallazgo(s)</span>
                  </div>
                  <span
                    className={`font-technical rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      data.severity === 'critical'
                        ? 'bg-red-500/15 text-red-300'
                        : data.severity === 'high'
                          ? 'bg-orange-500/15 text-orange-300'
                          : data.severity === 'medium'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-cyan-500/15 text-cyan-300'
                    }`}
                  >
                    {SEVERITY_LABEL[data.severity] ?? data.severity}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 border-t border-slate-800 pt-4">
            <p className="font-technical mb-2 text-[10px] uppercase tracking-wider text-slate-500">
              Factores de riesgo
            </p>
            {risk && risk.drivers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {risk.drivers.map((driver, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {driver}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-300">Sin factores de riesgo detectados</p>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className="text-xs leading-relaxed text-slate-400">
              Selecciona una zona iluminada del holograma para inspeccionar sus sensores y hallazgos asociados en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
