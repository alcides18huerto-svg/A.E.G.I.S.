import { useState } from 'react';
import type { AnomalyResult, SafetyAlert, SensorReading } from '../engine/types';

interface Props {
  reading: SensorReading | undefined;
  anomalies: AnomalyResult[];
  alerts: SafetyAlert[];
}

interface BodyZone {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  relatedParams: string[];
  relatedAreas: string[];
}

const BODY_ZONES: BodyZone[] = [
  {
    id: 'brain',
    name: 'Cerebro / Cognición',
    path: 'M 100 30 C 85 30 75 40 75 55 C 75 70 85 80 100 80 C 115 80 125 70 125 55 C 125 40 115 30 100 30 Z',
    labelX: 100,
    labelY: 55,
    relatedParams: ['stressIndex', 'sleepQuality'],
    relatedAreas: ['psychological'],
  },
  {
    id: 'heart',
    name: 'Corazón',
    path: 'M 90 115 C 85 110 80 115 80 120 C 80 128 90 135 100 145 C 110 135 120 128 120 120 C 120 115 115 110 110 115 C 105 118 100 118 95 115 Z',
    labelX: 100,
    labelY: 128,
    relatedParams: ['heartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP'],
    relatedAreas: ['cardiovascular'],
  },
  {
    id: 'lungs',
    name: 'Pulmones',
    path: 'M 75 110 C 70 115 68 130 72 145 C 75 155 80 160 85 160 L 85 120 Z M 125 110 C 130 115 132 130 128 145 C 125 155 120 160 115 160 L 115 120 Z',
    labelX: 75,
    labelY: 135,
    relatedParams: ['spo2', 'respiratoryRate'],
    relatedAreas: ['immune', 'cardiovascular'],
  },
  {
    id: 'temperature',
    name: 'Temperatura Corporal',
    path: 'M 95 90 L 95 170 L 105 170 L 105 90 Z',
    labelX: 100,
    labelY: 130,
    relatedParams: ['temperature', 'skinTemperature'],
    relatedAreas: ['immune'],
  },
  {
    id: 'bones',
    name: 'Sistema Óseo',
    path: 'M 60 160 L 60 250 L 70 250 L 70 160 Z M 130 160 L 130 250 L 140 250 L 140 160 Z',
    labelX: 65,
    labelY: 205,
    relatedParams: ['boneMarkers'],
    relatedAreas: ['bone'],
  },
  {
    id: 'environment',
    name: 'Entorno / Ambiental',
    path: 'M 50 50 L 150 50 L 150 280 L 50 280 Z M 55 55 L 145 55 L 145 275 L 55 275 Z',
    labelX: 150,
    labelY: 165,
    relatedParams: ['co2Level', 'ambientTemp', 'noiseLevel', 'radiationDose'],
    relatedAreas: ['environmental'],
  },
];

export default function HumanBody({ reading, anomalies, alerts }: Props) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  if (!reading) return null;

  // Determine which zones are active based on anomalies and alerts
  const activeZones = new Map<string, { severity: string; params: string[]; areas: string[] }>();

  // Check anomalies
  anomalies.forEach((anomaly) => {
    if (anomaly.severity === 'info') return;
    BODY_ZONES.forEach((zone) => {
      if (zone.relatedAreas.includes(anomaly.area)) {
        const existing = activeZones.get(zone.id);
        const severityOrder = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
        if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity as keyof typeof severityOrder]) {
          activeZones.set(zone.id, {
            severity: anomaly.severity,
            params: zone.relatedParams,
            areas: zone.relatedAreas,
          });
        }
      }
    });
  });

  // Check safety alerts
  alerts.forEach((alert) => {
    if (alert.acknowledged) return;
    BODY_ZONES.forEach((zone) => {
      if (zone.relatedParams.includes(alert.parameter)) {
        activeZones.set(zone.id, {
          severity: alert.severity === 'emergency' ? 'critical' : alert.severity,
          params: zone.relatedParams,
          areas: zone.relatedAreas,
        });
      }
    });
  });

  const getZoneColor = (zoneId: string) => {
    const active = activeZones.get(zoneId);
    if (!active) return 'fill-slate-700/30 stroke-slate-600';
    switch (active.severity) {
      case 'critical': return 'fill-red-500/40 stroke-red-400 animate-pulse';
      case 'high': return 'fill-orange-500/40 stroke-orange-400';
      case 'medium': return 'fill-amber-500/40 stroke-amber-400';
      case 'low': return 'fill-yellow-500/30 stroke-yellow-400';
      default: return 'fill-slate-700/30 stroke-slate-600';
    }
  };

  const selectedZoneData = selectedZone ? BODY_ZONES.find(z => z.id === selectedZone) : null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="text-2xl">🫀</span>
        Cuerpo Humano Virtual
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Body visualization */}
        <div className="relative">
          <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[500px]">
            {/* Background body silhouette */}
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Body outline */}
            <path
              d="M 100 20 C 80 20 70 35 70 50 C 70 65 75 75 80 80 L 75 90 L 60 100 L 55 160 L 60 250 L 70 280 L 80 280 L 85 250 L 90 180 L 100 180 L 110 180 L 115 250 L 120 280 L 130 280 L 140 250 L 145 160 L 140 100 L 125 90 L 120 80 C 125 75 130 65 130 50 C 130 35 120 20 100 20 Z"
              fill="url(#bodyGradient)"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Interactive zones */}
            {BODY_ZONES.filter(z => z.id !== 'environment').map((zone) => (
              <g key={zone.id}>
                <path
                  d={zone.path}
                  className={`${getZoneColor(zone.id)} cursor-pointer transition-all hover:opacity-80`}
                  strokeWidth="2"
                  onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                  filter={activeZones.has(zone.id) ? 'url(#glow)' : undefined}
                />
                {/* Label */}
                <text
                  x={zone.labelX}
                  y={zone.labelY}
                  textAnchor="middle"
                  className="fill-slate-300 text-xs pointer-events-none"
                  fontSize="8"
                >
                  {zone.name.split(' ')[0]}
                </text>
              </g>
            ))}

            {/* Environment zone (background) */}
            {activeZones.has('environment') && (
              <rect
                x="50"
                y="50"
                width="100"
                height="230"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="opacity-50"
              />
            )}
          </svg>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-400" />
              <span className="text-slate-400">Crítico</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500/40 border border-orange-400" />
              <span className="text-slate-400">Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-400" />
              <span className="text-slate-400">Medio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700/30 border border-slate-600" />
              <span className="text-slate-400">Normal</span>
            </div>
          </div>
        </div>

        {/* Zone details */}
        <div>
          {selectedZoneData ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-200 mb-2">{selectedZoneData.name}</h4>
                <div className="space-y-2">
                  {selectedZoneData.relatedParams.map((param) => {
                    const value = reading[param as keyof SensorReading];
                    return (
                      <div key={param} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                        <span className="text-sm text-slate-400">{getParamName(param)}</span>
                        <span className="text-sm font-medium text-slate-200">
                          {typeof value === 'number' ? value.toFixed(1) : value} {getParamUnit(param)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Related anomalies */}
              {anomalies.filter(a => selectedZoneData.relatedAreas.includes(a.area)).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-300 mb-2">Anomalías Detectadas</h5>
                  <div className="space-y-2">
                    {anomalies
                      .filter(a => selectedZoneData.relatedAreas.includes(a.area))
                      .slice(0, 3)
                      .map((anomaly) => (
                        <div key={anomaly.id} className={`p-2 rounded-lg border ${
                          anomaly.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                          anomaly.severity === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                          'border-amber-500/30 bg-amber-500/5'
                        }`}>
                          <p className="text-xs text-slate-300">{anomaly.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-4xl mb-3">👆</div>
                <p className="text-slate-400 text-sm">Haz clic en una zona del cuerpo para ver detalles</p>
                <p className="text-xs text-slate-600 mt-2">Las zonas se iluminan cuando se detectan anomalías</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getParamName(param: string): string {
  const names: Record<string, string> = {
    heartRate: 'Frecuencia Cardiaca',
    heartRateVariability: 'HRV',
    systolicBP: 'Presión Sistólica',
    diastolicBP: 'Presión Diastólica',
    temperature: 'Temperatura',
    skinTemperature: 'Temp. Piel',
    spo2: 'SpO2',
    stressIndex: 'Índice de Estrés',
    sleepQuality: 'Calidad de Sueño',
    co2Level: 'CO2 Ambiental',
    ambientTemp: 'Temp. Ambiente',
    noiseLevel: 'Nivel de Ruido',
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
