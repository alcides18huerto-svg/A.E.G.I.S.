import type { QualityFlags, SensorReading } from '../engine/types';

interface Props {
  quality: QualityFlags;
  reading: SensorReading | undefined;
}

export default function QualityPanel({ quality, reading }: Props) {
  if (!reading) return null;

  const qualityColor = {
    excellent: 'text-emerald-400',
    good: 'text-cyan-400',
    degraded: 'text-amber-400',
    invalid: 'text-red-400',
  };

  const qualityBg = {
    excellent: 'bg-emerald-500/10 border-emerald-500/30',
    good: 'bg-cyan-500/10 border-cyan-500/30',
    degraded: 'bg-amber-500/10 border-amber-500/30',
    invalid: 'bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Quality score */}
      <div className={`p-6 rounded-2xl border ${qualityBg[quality.overallQuality]}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-200">Control de Calidad de Datos</h4>
          <div className={`text-3xl font-bold ${qualityColor[quality.overallQuality]}`}>
            {quality.qualityScore}%
          </div>
        </div>

        {/* Quality bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quality.qualityScore >= 90 ? 'bg-emerald-500' :
              quality.qualityScore >= 70 ? 'bg-cyan-500' :
              quality.qualityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${quality.qualityScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0</span>
          <span className={`font-medium ${qualityColor[quality.overallQuality]}`}>
            {quality.overallQuality === 'excellent' ? 'Excelente' :
             quality.overallQuality === 'good' ? 'Buena' :
             quality.overallQuality === 'degraded' ? 'Degradada' : 'Inválida'}
          </span>
          <span>100</span>
        </div>
      </div>

      {/* Quality checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sensor faults */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${quality.sensorFaults.length > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
            Fallos de Sensor
          </h5>
          {quality.sensorFaults.length === 0 ? (
            <p className="text-sm text-emerald-400">Todos los sensores operativos</p>
          ) : (
            <div className="space-y-1">
              {quality.sensorFaults.map((fault) => (
                <div key={fault} className="flex items-center gap-2 text-sm text-red-300">
                  <span>✗</span>
                  <span>{getSensorName(fault)}</span>
                  <span className="text-xs text-red-400/60">— Datos no utilizados</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Degraded signals */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${quality.degradedSignals.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            Señales Degradadas
          </h5>
          {quality.degradedSignals.length === 0 ? (
            <p className="text-sm text-emerald-400">Sin degradación detectada</p>
          ) : (
            <div className="space-y-1">
              {quality.degradedSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-2 text-sm text-amber-300">
                  <span>⚠</span>
                  <span>{getSensorName(signal)}</span>
                  <span className="text-xs text-amber-400/60">— Usar con precaución</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing values */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${quality.missingValues.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            Valores Faltantes
          </h5>
          {quality.missingValues.length === 0 ? (
            <p className="text-sm text-emerald-400">Sin valores faltantes</p>
          ) : (
            <div className="space-y-1">
              {quality.missingValues.map((val) => (
                <div key={val} className="text-sm text-amber-300">• {getSensorName(val)}</div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${quality.timestampErrors ? 'bg-red-400' : 'bg-emerald-400'}`} />
            Integridad Temporal
          </h5>
          {quality.timestampErrors ? (
            <p className="text-sm text-red-300">Error en marca temporal detectado</p>
          ) : (
            <p className="text-sm text-emerald-400">Marcas temporales correctas</p>
          )}
        </div>
      </div>

      {/* Pipeline status */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <h5 className="text-sm font-medium text-slate-300 mb-3">Estado del Pipeline de Datos</h5>
        <div className="flex items-center gap-2">
          {['Captura', 'Calidad', 'Baseline', 'Anomalía', 'Seguridad', 'Interfaz'].map((stage, i) => {
            const isActive = quality.qualityScore > (i * 15);
            const isFault = i === 1 && quality.qualityScore < 70;
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isFault ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-600 border border-slate-700'
                }`}>
                  {stage}
                </div>
                {i < 5 && <span className="text-slate-600">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact explanation */}
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <h5 className="text-sm font-medium text-cyan-300 mb-2">Impacto en el análisis</h5>
        <p className="text-xs text-slate-400 leading-relaxed">
          {quality.qualityScore >= 70
            ? 'Los datos son suficientes para el análisis de anomalías y la actualización de la referencia individual.'
            : quality.qualityScore >= 40
            ? 'Datos degradados. El análisis de anomalías se realiza con menor confianza. La referencia individual no se actualiza con estos datos.'
            : 'Datos inválidos. No se realizan análisis. Las reglas de seguridad independientes siguen operando con los sensores disponibles.'}
        </p>
      </div>
    </div>
  );
}

function getSensorName(key: string): string {
  const names: Record<string, string> = {
    heartRate: 'Frecuencia cardiaca',
    temperature: 'Temperatura',
    spo2: 'SpO2',
    activityLevel: 'Actividad',
    co2Level: 'CO2 ambiental',
    heartRateVariability: 'HRV',
    systolicBP: 'Presión sistólica',
  };
  return names[key] || key;
}
