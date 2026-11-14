import type { CrewMember, QualityFlags, RiskScore } from '../engine/types';

interface Props {
  crew: CrewMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  qualityFlags: Map<string, QualityFlags>;
  riskScores?: Map<string, RiskScore>;
}

const RISK_STYLE = {
  nominal: { text: 'text-emerald-300', bar: 'bg-emerald-400' },
  watch: { text: 'text-amber-300', bar: 'bg-amber-400' },
  elevated: { text: 'text-orange-300', bar: 'bg-orange-400' },
  critical: { text: 'text-red-300', bar: 'bg-red-400' },
};

export default function CrewOverview({ crew, selectedId, onSelect, qualityFlags, riskScores }: Props) {
  const statusColors = {
    nominal: 'bg-emerald-500',
    watch: 'bg-amber-500',
    alert: 'bg-orange-500',
    critical: 'bg-red-500 animate-pulse',
  };

  const statusLabels = {
    nominal: 'Nominal',
    watch: 'Observación',
    alert: 'Alerta',
    critical: 'Crítico',
  };

  const counts = crew.reduce(
    (acc, member) => {
      acc[member.status] += 1;
      return acc;
    },
    { nominal: 0, watch: 0, alert: 0, critical: 0 } as Record<CrewMember['status'], number>
  );

  return (
    <div className="glass-panel rounded-2xl p-4 backdrop-blur-sm sticky top-24">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-400" />
        Tripulación
        <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-slate-600">{crew.length} a bordo</span>
      </h3>
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {(['nominal', 'watch', 'alert', 'critical'] as const).map((status) => (
          <div key={status} className="rounded-lg bg-slate-950/50 py-1.5 text-center">
            <div className={`text-sm font-bold ${status === 'nominal' ? 'text-emerald-300' : status === 'watch' ? 'text-amber-300' : status === 'alert' ? 'text-orange-300' : 'text-red-300'}`}>
              {counts[status]}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-600">{statusLabels[status].slice(0, 3)}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {crew.map((member) => {
          const quality = qualityFlags.get(member.id);
          const risk = riskScores?.get(member.id);
          const isSelected = member.id === selectedId;
          const riskStyle = RISK_STYLE[risk?.level ?? 'nominal'];

          return (
            <button
              key={member.id}
              onClick={() => onSelect(member.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-indigo-500/20 border border-indigo-500/40'
                  : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[member.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.role}</div>
                </div>
                {quality && (
                  <div className={`text-xs px-2 py-0.5 rounded-full ${
                    quality.overallQuality === 'excellent' ? 'bg-emerald-500/20 text-emerald-300' :
                    quality.overallQuality === 'good' ? 'bg-cyan-500/20 text-cyan-300' :
                    quality.overallQuality === 'degraded' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {quality.qualityScore}%
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{statusLabels[member.status]}</span>
                {member.baselineEstablished && (
                  <span className="text-indigo-400">· Base: {member.baselineDays}d</span>
                )}
                {!member.baselineEstablished && (
                  <span className="text-amber-400">· Estableciendo base</span>
                )}
                {risk && (
                  <span className={`ml-auto font-mono ${riskStyle.text}`} title={risk.drivers.join(' · ') || 'Sin factores de riesgo'}>
                    riesgo {risk.score}
                  </span>
                )}
              </div>
              {risk && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-950/60">
                  <div className={`h-full rounded-full ${riskStyle.bar} transition-all duration-500`} style={{ width: `${Math.max(3, risk.score)}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 mb-2">Estados:</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">Observación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-slate-400">Alerta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Crítico</span>
          </div>
        </div>
      </div>
    </div>
  );
}
