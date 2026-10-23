import { useState } from 'react';
import { useAEGIS } from '../hooks/useAEGIS';
import CrewOverview from './CrewOverview';
import SensorPanel from './SensorPanel';
import AlertPanel from './AlertPanel';
import QualityPanel from './QualityPanel';
import ControlPanel from './ControlPanel';
import HumanBody from './HumanBody';
import ActionProtocol from './ActionProtocol';

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
  } = useAEGIS();

  const [selectedCrewId, setSelectedCrewId] = useState<string>(state.crew[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'sensors' | 'alerts' | 'quality' | 'control'>('sensors');

  const selectedCrew = state.crew.find(c => c.id === selectedCrewId);
  const currentReading = state.currentReadings.get(selectedCrewId);
  const quality = state.qualityFlags.get(selectedCrewId);
  const baseline = state.baselines.get(selectedCrewId);
  const areas = state.areaAssessments.get(selectedCrewId) || [];
  const history = getHistory(selectedCrewId);
  const anomalies = getAnomalies(selectedCrewId, 15);
  const alerts = getAlerts(selectedCrewId, 15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-lg">AG</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">A.E.G.I.S.</h1>
                <p className="text-xs text-slate-400">Sistema de Monitorización de Salud en Vuelo Espacial</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Status indicators */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-slate-300">{isRunning ? 'Activo' : 'Pausado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${state.isOnline ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-300">{state.isOnline ? 'En línea' : 'Offline'}</span>
                </div>
                {!state.isOnline && (
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <span className="text-xs text-amber-300">Cola sync: {state.syncQueue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Crew overview */}
          <div className="col-span-12 lg:col-span-3">
            <CrewOverview
              crew={state.crew}
              selectedId={selectedCrewId}
              onSelect={setSelectedCrewId}
              qualityFlags={state.qualityFlags}
            />
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Selected crew info */}
            {selectedCrew && currentReading && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedCrew.name}</h2>
                    <p className="text-sm text-slate-400">{selectedCrew.role} · {selectedCrew.id}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCrew.status === 'nominal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    selectedCrew.status === 'watch' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    selectedCrew.status === 'alert' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                  }`}>
                    {selectedCrew.status === 'nominal' ? 'Nominal' :
                     selectedCrew.status === 'watch' ? 'Observación' :
                     selectedCrew.status === 'alert' ? 'Alerta' : 'Crítico'}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Frecuencia Cardiaca</div>
                    <div className="text-2xl font-bold text-white">{currentReading.heartRate} <span className="text-sm text-slate-400">bpm</span></div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Presión Arterial</div>
                    <div className="text-2xl font-bold text-white">{currentReading.systolicBP}/{currentReading.diastolicBP} <span className="text-sm text-slate-400">mmHg</span></div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Temperatura</div>
                    <div className="text-2xl font-bold text-white">{currentReading.temperature} <span className="text-sm text-slate-400">°C</span></div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">SpO2</div>
                    <div className="text-2xl font-bold text-white">{currentReading.spo2} <span className="text-sm text-slate-400">%</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Human Body and Action Protocol */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HumanBody
                reading={currentReading}
                anomalies={anomalies}
                alerts={alerts}
              />
              <ActionProtocol
                anomalies={anomalies}
                alerts={alerts}
              />
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 border-b border-slate-800">
              {[
                { id: 'sensors', label: 'Sensores y Análisis', icon: '📊' },
                { id: 'alerts', label: 'Alertas', icon: '🚨', count: alerts.length },
                { id: 'quality', label: 'Calidad de Datos', icon: '✓' },
                { id: 'control', label: 'Control del Sistema', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-indigo-300 border-b-2 border-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'sensors' && (
              <SensorPanel
                reading={currentReading}
                baseline={baseline}
                history={history}
                areas={areas}
                anomalies={anomalies}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertPanel
                alerts={alerts}
                anomalies={anomalies}
                onAcknowledge={acknowledgeAlert}
              />
            )}

            {activeTab === 'quality' && quality && (
              <QualityPanel quality={quality} reading={currentReading} />
            )}

            {activeTab === 'control' && (
              <ControlPanel
                config={config}
                isRunning={isRunning}
                isOnline={state.isOnline}
                onToggleEngine={toggleEngine}
                onToggleOnline={toggleOnline}
                onUpdateConfig={updateConfig}
                onInjectAnomaly={injectAnomaly}
                selectedCrewId={selectedCrewId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
