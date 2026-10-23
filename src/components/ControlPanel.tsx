import type { EngineConfig } from '../engine/types';

interface Props {
  config: EngineConfig;
  isRunning: boolean;
  isOnline: boolean;
  onToggleEngine: () => void;
  onToggleOnline: () => void;
  onUpdateConfig: (partial: Partial<EngineConfig>) => void;
  onInjectAnomaly: (crewId: string, type: string) => void;
  selectedCrewId: string;
}

const anomalyTypes = [
  { id: 'hr_high', label: 'FC Alta', desc: 'Simula taquicardia' },
  { id: 'hr_low', label: 'FC Baja', desc: 'Simula bradicardia' },
  { id: 'bp_high', label: 'PA Alta', desc: 'Simula hipertensión' },
  { id: 'temp_high', label: 'Fiebre', desc: 'Simula temperatura elevada' },
  { id: 'spo2_low', label: 'SpO2 Baja', desc: 'Simula hipoxia' },
  { id: 'stress_high', label: 'Estrés Alto', desc: 'Simula estrés elevado' },
  { id: 'sleep_low', label: 'Sueño Pobre', desc: 'Simula privación de sueño' },
  { id: 'co2_high', label: 'CO2 Alto', desc: 'Simula fallo ambiental' },
  { id: 'rad_high', label: 'Radiación', desc: 'Simula evento radiactivo' },
  { id: 'hrv_low', label: 'HRV Baja', desc: 'Simula baja variabilidad' },
];

export default function ControlPanel({
  config,
  isRunning,
  isOnline,
  onToggleEngine,
  onToggleOnline,
  onUpdateConfig,
  onInjectAnomaly,
  selectedCrewId,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Engine controls */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Control del Motor</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onToggleEngine}
            className={`p-4 rounded-xl border transition-all ${
              isRunning
                ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">{isRunning ? 'Motor Activo' : 'Motor Pausado'}</div>
                <div className="text-xs text-slate-500">Click para {isRunning ? 'pausar' : 'iniciar'}</div>
              </div>
            </div>
          </button>

          <button
            onClick={onToggleOnline}
            className={`p-4 rounded-xl border transition-all ${
              isOnline
                ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-cyan-400' : 'bg-amber-400'}`} />
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">{isOnline ? 'En línea (Tierra)' : 'Offline (Autónomo)'}</div>
                <div className="text-xs text-slate-500">Click para {isOnline ? 'desconectar' : 'reconectar'}</div>
              </div>
            </div>
          </button>
        </div>

        {!isOnline && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">
              <span className="font-medium">Modo offline activo:</span> Las funciones críticas (captura, calidad, análisis, alertas) continúan operando. 
              La sincronización con Tierra está en cola.
            </p>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Configuración del Sistema</h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Ruido de sensores</span>
              <span className="text-slate-500">{(config.sensorNoiseLevel * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={config.sensorNoiseLevel * 100}
              onChange={(e) => onUpdateConfig({ sensorNoiseLevel: Number(e.target.value) / 100 })}
              className="w-full h-2 rounded-full bg-slate-700 appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Tasa de fallo de sensores</span>
              <span className="text-slate-500">{(config.faultInjectionRate * 100).toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={config.faultInjectionRate * 100}
              onChange={(e) => onUpdateConfig({ faultInjectionRate: Number(e.target.value) / 100 })}
              className="w-full h-2 rounded-full bg-slate-700 appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Anomaly injection */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Inyección de Anomalías</h4>
        <p className="text-xs text-slate-500 mb-4">
          Simula condiciones fisiológicas o ambientales para probar el sistema. 
          Los datos inyectados serán procesados por todas las etapas del pipeline.
        </p>
        <div className="mb-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-xs text-indigo-300">Tripulante seleccionado: <span className="font-mono">{selectedCrewId}</span></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {anomalyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onInjectAnomaly(selectedCrewId, type.id)}
              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left group"
            >
              <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300">{type.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Pipeline de Procesamiento</h4>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { name: '1. Captura', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300', desc: 'Sensores + timestamp' },
            { name: '2. Calidad', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', desc: 'Validación + flags' },
            { name: '3. Referencia', color: 'bg-purple-500/20 border-purple-500/30 text-purple-300', desc: 'Baseline individual' },
            { name: '4. Anomalías', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300', desc: 'Z-score + tendencias' },
            { name: '5. Seguridad', color: 'bg-red-500/20 border-red-500/30 text-red-300', desc: 'Reglas independientes' },
            { name: '6. Interfaz', color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300', desc: 'Dashboard + alertas' },
          ].map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-lg border ${stage.color}`}>
                <div className="text-xs font-medium">{stage.name}</div>
                <div className="text-xs opacity-60">{stage.desc}</div>
              </div>
              {i < 5 && <span className="text-slate-600 text-lg">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <p className="text-xs text-red-300">
            <span className="font-medium">Nota:</span> La etapa 5 (Reglas de Seguridad) opera de forma independiente al motor predictivo (etapa 4). 
            Si se cumple una condición crítica, se activa la respuesta sin esperar a la IA.
          </p>
        </div>
      </div>
    </div>
  );
}
