import { lazy, Suspense, useMemo, useState } from 'react';
import type { AnomalyResult, SafetyAlert, SensorReading } from '../engine/types';
import type { HologramZoneState } from './HologramScene';

const HologramScene = lazy(() => import('./HologramScene'));

interface Props {
  reading: SensorReading | undefined;
  anomalies: AnomalyResult[];
  alerts: SafetyAlert[];
}

interface BodyZone {
  id: string;
  name: string;
  relatedParams: string[];
  relatedAreas: string[];
}

const BODY_ZONES: BodyZone[] = [
  { id: 'brain', name: 'Cerebro', relatedParams: ['stressIndex', 'sleepQuality'], relatedAreas: ['psychological'] },
  { id: 'heart', name: 'Corazón', relatedParams: ['heartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP'], relatedAreas: ['cardiovascular'] },
  { id: 'lungs', name: 'Pulmones', relatedParams: ['spo2'], relatedAreas: ['immune'] },
  { id: 'core', name: 'Núcleo / Temp.', relatedParams: ['temperature', 'skinTemperature'], relatedAreas: ['immune'] },
  { id: 'bones', name: 'Sistema Óseo', relatedParams: [], relatedAreas: ['bone'] },
  { id: 'env', name: 'Entorno', relatedParams: ['co2Level', 'ambientTemp', 'noiseLevel', 'radiationDose'], relatedAreas: ['environmental'] },
];

const SEVERITY_ORDER: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#eab308';
    default: return '#22d3ee';
  }
}

export default function HumanBody({ reading, anomalies, alerts }: Props) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const activeZones = useMemo(() => {
    const active = new Map<string, string>();
    anomalies.forEach((anomaly) => {
      if (anomaly.severity === 'info') return;
      BODY_ZONES.forEach((zone) => {
        if (!zone.relatedAreas.includes(anomaly.area)) return;
        const existing = active.get(zone.id);
        if (!existing || SEVERITY_ORDER[anomaly.severity] > SEVERITY_ORDER[existing]) {
          active.set(zone.id, anomaly.severity);
        }
      });
    });

    alerts.forEach((alert) => {
      if (alert.acknowledged) return;
      BODY_ZONES.forEach((zone) => {
        if (!zone.relatedParams.includes(alert.parameter)) return;
        const severity = alert.severity === 'emergency' ? 'critical' : alert.severity;
        const existing = active.get(zone.id);
        if (!existing || SEVERITY_ORDER[severity] > SEVERITY_ORDER[existing]) {
          active.set(zone.id, severity);
        }
      });
    });
    return active;
  }, [anomalies, alerts]);

  const hologramZones: HologramZoneState[] = BODY_ZONES.map((zone) => {
    const severity = activeZones.get(zone.id);
    return {
      id: zone.id,
      color: getSeverityColor(severity ?? 'normal'),
      active: Boolean(severity),
      selected: selectedZone === zone.id,
    };
  });

  if (!reading) return null;

  const selectedZoneData = BODY_ZONES.find((zone) => zone.id === selectedZone);
  const relatedAnomalies = selectedZoneData
    ? anomalies.filter((anomaly) => selectedZoneData.relatedAreas.includes(anomaly.area))
    : [];
  const selectedZoneIsActive = selectedZoneData ? activeZones.has(selectedZoneData.id) : false;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <span className="text-cyan-300" aria-hidden="true">◈</span>
            Holograma biomédico 3D
          </h3>
          <p className="mt-1 text-xs text-slate-500">Modelo interactivo · telemetría y alertas en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-900/70 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-200">
          <span className={`h-1.5 w-1.5 rounded-full ${activeZones.size ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          {activeZones.size ? `${activeZones.size} zona${activeZones.size === 1 ? '' : 's'} en observación` : 'Sistemas nominales'}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
        <div className="min-w-0">
          <Suspense fallback={<div className="hologram-stage flex items-center justify-center text-sm text-cyan-200">Inicializando holograma 3D…</div>}>
            <HologramScene zones={hologramZones} onSelectZone={setSelectedZone} />
          </Suspense>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-300" /> Normal</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" /> Medio</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-500" /> Alto</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-500" /> Crítico</span>
          </div>
        </div>

        <div className="min-h-[250px]">
          {selectedZoneData ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/45 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedZoneIsActive ? 'animate-pulse' : ''}`} style={{ backgroundColor: getSeverityColor(activeZones.get(selectedZoneData.id) ?? 'normal') }} />
                    {selectedZoneData.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedZone(null)}
                    className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-700 hover:text-white"
                    aria-label="Cerrar detalle de zona"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedZoneData.relatedParams.map((param) => {
                    const value = reading[param as keyof SensorReading];
                    if (value === undefined) return null;
                    return (
                      <div key={param} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 p-2.5">
                        <span className="text-sm text-slate-400">{getParamName(param)}</span>
                        <span className="whitespace-nowrap font-mono text-sm font-medium text-slate-100">
                          {typeof value === 'number' ? value.toFixed(1) : value}
                          <span className="ml-1 text-xs text-slate-500">{getParamUnit(param)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {selectedZoneData.relatedParams.length === 0 && (
                    <p className="text-sm italic text-slate-500">Sin sensores directos en esta fase</p>
                  )}
                </div>
              </div>

              {relatedAnomalies.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <h5 className="mb-2 text-sm font-medium text-red-300">Anomalías detectadas</h5>
                  <div className="space-y-2">
                    {relatedAnomalies.slice(0, 3).map((anomaly) => (
                      <div key={anomaly.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-2.5">
                        <p className="text-xs text-slate-300">{anomaly.description}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">Confianza: {(anomaly.confidence * 100).toFixed(0)}%</span>
                          <span className="rounded px-1.5 py-0.5 text-xs capitalize" style={{ backgroundColor: `${getSeverityColor(anomaly.severity)}22`, color: getSeverityColor(anomaly.severity) }}>
                            {anomaly.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`rounded-xl border p-3 ${selectedZoneIsActive ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                <p className={`text-sm ${selectedZoneIsActive ? 'text-amber-200' : 'text-emerald-300'}`}>
                  {selectedZoneIsActive ? 'Anomalía activa — revisar protocolo de acción' : 'Zona dentro de parámetros normales'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/25 p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-900/70 bg-cyan-950/40 text-2xl text-cyan-200" aria-hidden="true">⌖</div>
              <p className="mb-1 text-sm font-medium text-slate-200">Explora el holograma</p>
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Arrastra para girar, usa la rueda para acercar y selecciona una zona iluminada para consultar sus sensores.
              </p>
              <div className="mt-5 grid w-full max-w-xs grid-cols-2 gap-2 text-left">
                {BODY_ZONES.map((zone) => (
                  <button
                    type="button"
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-xs text-slate-400 transition hover:border-cyan-800 hover:text-cyan-100"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getSeverityColor(activeZones.get(zone.id) ?? 'normal') }} />
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getParamName(param: string): string {
  const names: Record<string, string> = {
    heartRate: 'Frecuencia cardiaca',
    heartRateVariability: 'Variabilidad cardiaca',
    systolicBP: 'Presión sistólica',
    diastolicBP: 'Presión diastólica',
    temperature: 'Temperatura',
    skinTemperature: 'Temperatura de piel',
    spo2: 'Saturación de oxígeno',
    stressIndex: 'Índice de estrés',
    sleepQuality: 'Calidad de sueño',
    co2Level: 'CO2 ambiental',
    ambientTemp: 'Temperatura ambiente',
    noiseLevel: 'Nivel de ruido',
    radiationDose: 'Radiación',
  };
  return names[param] || param;
}

function getParamUnit(param: string): string {
  const units: Record<string, string> = {
    heartRate: 'bpm',
    heartRateVariability: 'ms',
    systolicBP: 'mmHg',
    diastolicBP: 'mmHg',
    temperature: '°C',
    skinTemperature: '°C',
    spo2: '%',
    stressIndex: '/100',
    sleepQuality: '/100',
    co2Level: 'ppm',
    ambientTemp: '°C',
    noiseLevel: 'dB',
    radiationDose: 'mSv/h',
  };
  return units[param] || '';
}
