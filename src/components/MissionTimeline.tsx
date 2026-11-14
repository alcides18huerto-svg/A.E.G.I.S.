import { useMemo, useState } from 'react';
import type { CrewMember, MissionEvent } from '../engine/types';

interface Props {
  events: MissionEvent[];
  crew: CrewMember[];
}

type Filter = 'all' | 'alert' | 'anomaly';

const SEVERITY_COLOR: Record<string, string> = {
  emergency: 'bg-red-500 shadow-red-500/60',
  critical: 'bg-red-400 shadow-red-400/50',
  high: 'bg-orange-400 shadow-orange-400/50',
  warning: 'bg-amber-400 shadow-amber-400/50',
  medium: 'bg-amber-400 shadow-amber-400/40',
  low: 'bg-yellow-400 shadow-yellow-400/30',
  info: 'bg-cyan-400 shadow-cyan-400/30',
};

const SEVERITY_TEXT: Record<string, string> = {
  emergency: 'text-red-300',
  critical: 'text-red-300',
  high: 'text-orange-300',
  warning: 'text-amber-300',
  medium: 'text-amber-300',
  low: 'text-yellow-300',
  info: 'text-cyan-300',
};

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MissionTimeline({ events, crew }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const crewName = useMemo(() => {
    const map = new Map<string, CrewMember>();
    crew.forEach((member) => map.set(member.id, member));
    return map;
  }, [crew]);

  const filtered = filter === 'all' ? events : events.filter((event) => event.kind === filter);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Todo', count: events.length },
    { id: 'alert', label: 'Alertas', count: events.filter((e) => e.kind === 'alert').length },
    { id: 'anomaly', label: 'Anomalías', count: events.filter((e) => e.kind === 'anomaly').length },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl glass-panel p-5 backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
            <span className="text-indigo-300" aria-hidden="true">◷</span>
            Línea de tiempo de misión
          </h4>
          <p className="mt-1 text-xs text-slate-500">Alertas y anomalías fusionadas en orden cronológico</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === item.id ? 'bg-indigo-500/25 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.label}
              <span className="ml-1 text-slate-500">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/30 p-8 text-center">
          <div className="mb-2 text-2xl" aria-hidden="true">✓</div>
          <p className="text-sm text-slate-400">Sin eventos en esta vista</p>
          <p className="mt-1 text-xs text-slate-600">La telemetría aparece aquí a medida que el motor procesa lecturas</p>
        </div>
      ) : (
        <div className="relative max-h-[420px] space-y-3 overflow-y-auto pr-1">
          <div className="absolute bottom-0 left-[7px] top-1 w-px bg-slate-800" aria-hidden="true" />
          {filtered.map((event) => {
            const member = crewName.get(event.crewId);
            const dot = SEVERITY_COLOR[event.severity] ?? 'bg-slate-500';
            const text = SEVERITY_TEXT[event.severity] ?? 'text-slate-400';
            return (
              <div key={`${event.kind}-${event.id}`} className="relative flex gap-3 pl-0">
                <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 flex-shrink-0 rounded-full shadow ${dot} ${event.severity === 'critical' || event.severity === 'emergency' ? 'animate-pulse' : ''}`} />
                <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{event.severity}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {event.kind === 'alert' ? 'Seguridad' : 'IA'}
                    </span>
                    <span className="truncate text-xs text-slate-400">{member?.name ?? event.crewId}</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-600">-{relativeTime(event.timestamp)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-200" title={event.title}>{event.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500" title={event.detail}>{event.detail}</p>
                  {event.kind === 'alert' && event.acknowledged && (
                    <span className="mt-1 inline-block text-[10px] text-emerald-400">✓ reconocida</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
