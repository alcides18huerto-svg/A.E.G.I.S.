import type { EngineConfig, PipelineStageMetric, PipelineTelemetry } from '../engine/types';

interface Props {
  pipeline: PipelineTelemetry;
  config: EngineConfig;
  isRunning: boolean;
  isOnline: boolean;
}

const STAGE_DETAIL: Record<PipelineStageMetric['id'], string> = {
  capture: 'Sensores + marca temporal',
  quality: 'Validación y flags',
  baseline: 'Referencia individual',
  anomaly: 'Z-score · tendencia · persistencia',
  safety: 'Reglas clínicas independientes',
  interface: 'Riesgo · áreas · alertas',
};

const STATUS_STYLE: Record<PipelineStageMetric['status'], { card: string; dot: string; label: string; text: string }> = {
  ok: { card: 'border-emerald-500/25 bg-emerald-500/[0.04]', dot: 'bg-emerald-400', label: 'OK', text: 'text-emerald-300' },
  degraded: { card: 'border-amber-500/30 bg-amber-500/[0.05]', dot: 'bg-amber-400', label: 'DEGRADADO', text: 'text-amber-300' },
  fault: { card: 'border-red-500/35 bg-red-500/[0.06]', dot: 'bg-red-400', label: 'FALLO', text: 'text-red-300' },
  idle: { card: 'border-slate-700 bg-slate-800/30', dot: 'bg-slate-500', label: 'INACTIVO', text: 'text-slate-400' },
};

export default function SystemBlocksMonitor({ pipeline, config, isRunning, isOnline }: Props) {
  const healthyStages = pipeline.stages.filter((stage) => stage.status === 'ok').length;
  const healthPct = pipeline.stages.length ? (healthyStages / pipeline.stages.length) * 100 : 0;
  const throughput = pipeline.ticks > 0 ? pipeline.readingsProcessed / pipeline.ticks : 0;

  return (
    <div className="rounded-2xl glass-panel p-5 backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
            <span className="text-cyan-300" aria-hidden="true">▦</span>
            Bloques del sistema
          </h4>
          <p className="mt-1 text-xs text-slate-500">Observabilidad en vivo del pipeline de procesamiento</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 ${isRunning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
            {isRunning ? 'Motor activo' : 'Motor pausado'}
          </span>
          <span className={`rounded-full border px-3 py-1 ${isOnline ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
            {isOnline ? 'Sincronizado' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Salud del pipeline" value={`${healthPct.toFixed(0)}%`} tone={healthPct >= 90 ? 'emerald' : healthPct >= 60 ? 'amber' : 'red'} />
        <Stat label="Latencia de tick" value={`${pipeline.tickDurationMs.toFixed(1)} ms`} tone={pipeline.tickDurationMs < 50 ? 'cyan' : 'amber'} />
        <Stat label="Lecturas / tick" value={`${throughput.toFixed(1)}`} tone="indigo" />
        <Stat label="Total procesado" value={`${pipeline.readingsProcessed}`} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pipeline.stages.map((stage, index) => {
          const style = STATUS_STYLE[stage.status];
          return (
            <div key={stage.id} className={`relative rounded-xl border p-4 ${style.card}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500">BLOQUE {index + 1}</span>
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wide ${style.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${stage.status === 'fault' ? 'animate-pulse' : ''}`} />
                  {style.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-100">{stage.name}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{STAGE_DETAIL[stage.id]}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[11px] text-slate-500">
                <span>Δt <span className="font-mono text-slate-300">{stage.lastDurationMs.toFixed(2)} ms</span></span>
                <span>n=<span className="font-mono text-slate-300">{stage.processed}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2">
          <span>Anomalías emitidas</span>
          <span className="font-mono text-orange-300">{pipeline.anomaliesEmitted}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Alertas de seguridad emitidas</span>
          <span className="font-mono text-red-300">{pipeline.alertsEmitted}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Ruido de sensores</span>
          <span className="font-mono text-slate-300">{(config.sensorNoiseLevel * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Tasa de fallo</span>
          <span className="font-mono text-slate-300">{(config.faultInjectionRate * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'red' | 'cyan' | 'indigo' | 'slate' }) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
    cyan: 'text-cyan-300',
    indigo: 'text-indigo-300',
    slate: 'text-slate-200',
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
