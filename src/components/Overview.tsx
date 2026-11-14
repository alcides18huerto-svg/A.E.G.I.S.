import { Activity, Bell, Scan, Satellite } from 'lucide-react';
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
import type { SectionId } from './Sidebar';
import SystemHealthBar from './SystemHealthBar';
import CrewOverview from './CrewOverview';

interface Props {
  crew: CrewMember[];
  selectedCrewId: string;
  onSelectCrew: (id: string) => void;
  riskScores: Map<string, RiskScore>;
  qualityFlags: Map<string, QualityFlags>;
  alerts: SafetyAlert[];
  anomalies: AnomalyResult[];
  radiationProfiles: Map<string, RadiationProfile>;
  pipeline: PipelineTelemetry;
  isOnline: boolean;
  syncQueue: number;
  onNavigate: (id: SectionId) => void;
}

export default function Overview({
  crew,
  selectedCrewId,
  onSelectCrew,
  riskScores,
  qualityFlags,
  alerts,
  anomalies,
  radiationProfiles,
  pipeline,
  isOnline,
  syncQueue,
  onNavigate,
}: Props) {
  const shortcuts: { id: SectionId; label: string; detail: string; icon: typeof Scan }[] = [
    { id: 'hologram', label: 'Holograma', detail: '3D y signos vitales', icon: Scan },
    { id: 'sensors', label: 'Sensores', detail: 'Series temporales', icon: Activity },
    { id: 'alerts', label: 'Alertas', detail: 'Reglas y anomalías', icon: Bell },
    { id: 'mission', label: 'Misión', detail: 'Pipeline y eventos', icon: Satellite },
  ];

  return (
    <div className="space-y-6">
      <SystemHealthBar
        crew={crew}
        riskScores={riskScores}
        alerts={alerts}
        anomalies={anomalies}
        qualityFlags={qualityFlags}
        radiationProfiles={radiationProfiles}
        pipeline={pipeline}
        isOnline={isOnline}
        syncQueue={syncQueue}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4">
          <CrewOverview
            crew={crew}
            selectedId={selectedCrewId}
            onSelect={onSelectCrew}
            qualityFlags={qualityFlags}
            riskScores={riskScores}
          />
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-8">
          <RadiationExposure crew={crew} radiationProfiles={radiationProfiles} />

          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="font-technical text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Accesos a módulos
                </h3>
                <p className="mt-1 text-xs text-slate-500">Navegación directa a las áreas de análisis</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon;
                return (
                  <button
                    key={shortcut.id}
                    type="button"
                    onClick={() => onNavigate(shortcut.id)}
                    className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400 transition-colors group-hover:text-cyan-300">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-200">{shortcut.label}</span>
                      <span className="block truncate text-[11px] text-slate-500">{shortcut.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadiationExposure({
  crew,
  radiationProfiles,
}: {
  crew: CrewMember[];
  radiationProfiles: Map<string, RadiationProfile>;
}) {
  const limit = RADIATION_LIMITS.careerLimitMsv;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-technical text-sm font-semibold uppercase tracking-wider text-slate-300">
            Dosis de carrera · ALARA
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Exposición acumulada por tripulante frente al límite de {limit} mSv
          </p>
        </div>
        <span className="font-technical rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-200">
          Límite {limit} mSv
        </span>
      </div>

      <div className="space-y-3">
        {crew.map((member) => {
          const profile = radiationProfiles.get(member.id);
          const rawTotal = Number(profile?.preflightPriorMsv ?? 0) + Number(profile?.cumulativeDoseMsv ?? 0);
          const total = Number.isFinite(rawTotal) ? rawTotal : 0;
          const pct = limit > 0 ? Math.min(100, Math.max(0, (total / limit) * 100)) : 0;
          const tone = pct >= 80 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-indigo-400';

          return (
            <div key={member.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-slate-300">{member.name}</span>
                <span className="font-technical whitespace-nowrap text-slate-500">
                  {total.toFixed(2)} mSv · {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${Math.max(2, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
