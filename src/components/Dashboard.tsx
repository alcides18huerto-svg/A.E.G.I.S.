import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useAEGIS } from '../hooks/useAEGIS';
import Sidebar, { SECTIONS, type SectionId } from './Sidebar';
import Overview from './Overview';
import HologramDashboard from './HologramDashboard';
import SensorPanel from './SensorPanel';
import AlertPanel from './AlertPanel';
import QualityPanel from './QualityPanel';
import ControlPanel from './ControlPanel';
import SystemBlocksMonitor from './SystemBlocksMonitor';
import MissionTimeline from './MissionTimeline';

export default function Dashboard() {
  const {
    state,
    config,
    isRunning,
    toggleEngine,
    updateConfig,
    toggleOnline,
    injectAnomaly,
    acknowledgeAlert,
    getHistory,
    getAnomalies,
    getAlerts,
    getMissionEvents,
    exportReport,
  } = useAEGIS();

  const [selectedCrewId, setSelectedCrewId] = useState<string>(state.crew[0]?.id || '');
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (state.crew.length > 0 && !state.crew.some((member) => member.id === selectedCrewId)) {
      setSelectedCrewId(state.crew[0].id);
    }
  }, [state.crew, selectedCrewId]);

  const systemAlerts = state.safetyAlerts.filter((alert) => !alert.acknowledged);
  const criticalAlerts = systemAlerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'emergency'
  );

  const activeMeta = SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <Overview
            crew={state.crew}
            selectedCrewId={selectedCrewId}
            onSelectCrew={setSelectedCrewId}
            riskScores={state.riskScores}
            qualityFlags={state.qualityFlags}
            alerts={state.safetyAlerts}
            anomalies={state.anomalies}
            radiationProfiles={state.radiationProfiles}
            pipeline={state.pipeline}
            isOnline={state.isOnline}
            syncQueue={state.syncQueue}
            onNavigate={setActiveSection}
          />
        );

      case 'hologram': {
        const member = state.crew.find((c) => c.id === selectedCrewId);
        const reading = state.currentReadings.get(selectedCrewId);
        const risk = state.riskScores.get(selectedCrewId);
        const anomalies = getAnomalies(selectedCrewId, 15);
        const alerts = getAlerts(selectedCrewId, 15);
        return (
          <HologramDashboard
            crewId={selectedCrewId}
            member={member}
            reading={reading}
            risk={risk}
            anomalies={anomalies}
            alerts={alerts}
          />
        );
      }

      case 'sensors': {
        const reading = state.currentReadings.get(selectedCrewId);
        const baseline = state.baselines.get(selectedCrewId);
        const history = getHistory(selectedCrewId);
        const areas = state.areaAssessments.get(selectedCrewId) || [];
        const hazards = state.hazardAssessments?.get(selectedCrewId) || [];
        return (
          <SensorPanel
            reading={reading}
            baseline={baseline}
            history={history}
            areas={areas}
            hazards={hazards}
          />
        );
      }

      case 'alerts': {
        const alerts = getAlerts(selectedCrewId, 15);
        const anomalies = getAnomalies(selectedCrewId, 15);
        return <AlertPanel alerts={alerts} anomalies={anomalies} onAcknowledge={acknowledgeAlert} />;
      }

      case 'quality': {
        const quality = state.qualityFlags.get(selectedCrewId);
        const reading = state.currentReadings.get(selectedCrewId);
        return quality ? (
          <QualityPanel quality={quality} reading={reading} />
        ) : (
          <EmptyState message="Sin datos de calidad para el tripulante seleccionado" />
        );
      }

      case 'mission': {
        const missionEvents = getMissionEvents(selectedCrewId, 30);
        return (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SystemBlocksMonitor
              pipeline={state.pipeline}
              config={config}
              isRunning={isRunning}
              isOnline={state.isOnline}
            />
            <MissionTimeline events={missionEvents} crew={state.crew} />
          </div>
        );
      }

      case 'control':
        return (
          <ControlPanel
            config={config}
            isRunning={isRunning}
            isOnline={state.isOnline}
            onToggleEngine={toggleEngine}
            onToggleOnline={toggleOnline}
            onUpdateConfig={updateConfig}
            onInjectAnomaly={injectAnomaly}
            onExport={exportReport}
            selectedCrewId={selectedCrewId}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="aegis-shell min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <Sidebar
        active={activeSection}
        onNavigate={setActiveSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isRunning={isRunning}
        isOnline={state.isOnline}
        syncQueue={state.syncQueue}
        activeAlerts={systemAlerts.length}
        criticalAlerts={criticalAlerts.length}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Abrir menú de secciones"
            >
              <Menu size={20} />
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                Centro de control de misión
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
                <span className="hidden sm:inline">Tripulante</span>
                <select
                  value={selectedCrewId}
                  onChange={(event) => setSelectedCrewId(event.target.value)}
                  className="max-w-[9rem] cursor-pointer bg-transparent text-xs font-medium text-slate-200 outline-none"
                  aria-label="Seleccionar tripulante"
                >
                  {state.crew.map((member) => (
                    <option key={member.id} value={member.id} className="bg-slate-900 text-slate-200">
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-technical text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
                  A.E.G.I.S. · {activeMeta.label}
                </p>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{activeMeta.label}</h2>
                <p className="text-sm text-slate-500">{activeMeta.desc}</p>
              </div>
              <div className="font-technical hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Sesión segura · telemetría en vivo
              </div>
            </div>

            <div key={activeSection} className="aegis-section">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl glass-panel p-10 text-center">
      <div className="mb-2 text-3xl text-slate-600" aria-hidden="true">◌</div>
      <p className="text-sm text-slate-400">{message}</p>
      <p className="mt-1 text-xs text-slate-600">El motor actualizará la vista en el próximo ciclo de telemetría</p>
    </div>
  );
}
