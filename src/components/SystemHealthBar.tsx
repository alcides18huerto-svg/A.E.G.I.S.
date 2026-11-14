import { Activity, Bell, Database, Radiation, ShieldCheck, Wifi } from 'lucide-react';
import type {
  AnomalyResult,
  CrewMember,
  PipelineTelemetry,
  QualityFlags,
  RadiationProfile,
  RiskScore,
  SafetyAlert,
} from '../engine/types';
import { RADIATION_LIMITS } from '../engine/thresholds';

interface Props {
  crew: CrewMember[];
  riskScores: Map<string, RiskScore>;
  alerts: SafetyAlert[];
  anomalies: AnomalyResult[];
  qualityFlags: Map<string, QualityFlags>;
  radiationProfiles: Map<string, RadiationProfile>;
  pipeline: PipelineTelemetry;
  isOnline: boolean;
  syncQueue: number;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  progress: number;
  accent: 'emerald' | 'cyan' | 'amber' | 'orange' | 'red' | 'indigo';
  icon: typeof ShieldCheck;
}

const ACCENTS: Record<Kpi['accent'], { text: string; bar: string; ring: string }> = {
  emerald: { text: 'text-emerald-300', bar: 'bg-emerald-400', ring: 'border-emerald-500/30 bg-emerald-500/5' },
  cyan: { text: 'text-cyan-300', bar: 'bg-cyan-400', ring: 'border-cyan-500/30 bg-cyan-500/5' },
  amber: { text: 'text-amber-300', bar: 'bg-amber-400', ring: 'border-amber-500/30 bg-amber-500/5' },
  orange: { text: 'text-orange-300', bar: 'bg-orange-400', ring: 'border-orange-500/30 bg-orange-500/5' },
  red: { text: 'text-red-300', bar: 'bg-red-400', ring: 'border-red-500/30 bg-red-500/5' },
  indigo: { text: 'text-indigo-300', bar: 'bg-indigo-400', ring: 'border-indigo-500/30 bg-indigo-500/5' },
};

export default function SystemHealthBar({
  crew,
  riskScores,
  alerts,
  anomalies,
  qualityFlags,
  radiationProfiles,
  pipeline,
  isOnline,
  syncQueue,
}: Props) {
  const risks = crew.map((member) => riskScores.get(member.id)?.score ?? 0);
  const avgRisk = risks.length ? risks.reduce((a, b) => a + b, 0) / risks.length : 0;
  const readiness = Math.round(100 - avgRisk);

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical' || a.severity === 'emergency');

  const recentWindow = pipeline.lastTickAt || Date.now();
  const recentAnomalies = anomalies.filter((a) => a.timestamp > recentWindow - 60000);

  const qualities = crew.map((member) => qualityFlags.get(member.id)?.qualityScore ?? 100);
  const avgQuality = qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 100;

  const careerPct = crew.reduce((max, member) => {
    const profile = radiationProfiles.get(member.id);
    if (!profile) return max;
    const pct = ((profile.preflightPriorMsv + profile.cumulativeDoseMsv) / RADIATION_LIMITS.careerLimitMsv) * 100;
    return Math.max(max, pct);
  }, 0);

  const overallStatus = criticalAlerts.length > 0
    ? 'critical'
    : avgRisk >= 45 || activeAlerts.length > 0
      ? 'watch'
      : 'nominal';

  const kpis: Kpi[] = [
    {
      label: 'Aptitud de tripulación',
      value: `${readiness}%`,
      hint: overallStatus === 'critical' ? 'Condición crítica a bordo' : overallStatus === 'watch' ? 'Vigilancia operacional' : 'Todos los sistemas nominales',
      progress: readiness,
      accent: readiness >= 80 ? 'emerald' : readiness >= 55 ? 'amber' : 'red',
      icon: ShieldCheck,
    },
    {
      label: 'Alertas activas',
      value: `${activeAlerts.length}`,
      hint: criticalAlerts.length ? `${criticalAlerts.length} crítica(s) sin reconocer` : 'Sin alertas críticas pendientes',
      progress: Math.min(100, activeAlerts.length * 20),
      accent: criticalAlerts.length ? 'red' : activeAlerts.length ? 'amber' : 'emerald',
      icon: Bell,
    },
    {
      label: 'Anomalías (60 s)',
      value: `${recentAnomalies.length}`,
      hint: recentAnomalies.some((a) => a.type === 'sustained') ? 'Patrón sostenido detectado' : 'Ventana móvil del motor IA',
      progress: Math.min(100, recentAnomalies.length * 12),
      accent: recentAnomalies.length ? 'orange' : 'emerald',
      icon: Activity,
    },
    {
      label: 'Integridad de datos',
      value: `${avgQuality.toFixed(0)}%`,
      hint: avgQuality >= 90 ? 'Sensores estables' : avgQuality >= 70 ? 'Señal aceptable' : 'Datos degradados',
      progress: avgQuality,
      accent: avgQuality >= 90 ? 'cyan' : avgQuality >= 70 ? 'amber' : 'red',
      icon: Database,
    },
    {
      label: 'Dosis de carrera',
      value: `${careerPct.toFixed(1)}%`,
      hint: `Límite ${RADIATION_LIMITS.careerLimitMsv} mSv · ALARA`,
      progress: Math.min(100, careerPct),
      accent: careerPct >= 80 ? 'red' : careerPct >= 60 ? 'orange' : 'indigo',
      icon: Radiation,
    },
    {
      label: 'Enlace y telemetría',
      value: isOnline ? 'En línea' : 'Offline',
      hint: `Tick ${pipeline.tickDurationMs.toFixed(1)} ms · Cola ${syncQueue}`,
      progress: isOnline ? 100 : Math.min(100, syncQueue * 4),
      accent: isOnline ? 'cyan' : 'amber',
      icon: Wifi,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const accent = ACCENTS[kpi.accent];
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={`rounded-2xl border p-4 backdrop-blur-sm transition-colors ${accent.ring}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{kpi.label}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/80 text-slate-400" aria-hidden="true">
                <Icon size={14} />
              </span>
            </div>
            <div className={`text-2xl font-bold leading-none ${accent.text}`}>{kpi.value}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${accent.bar} transition-all duration-500`}
                style={{ width: `${Math.max(2, Math.min(100, kpi.progress))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-tight text-slate-500" title={kpi.hint}>{kpi.hint}</p>
          </div>
        );
      })}
    </section>
  );
}
