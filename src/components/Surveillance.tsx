const areas = [
  {
    title: 'Cambios inmunitarios',
    info: 'Tendencias de sueño, variabilidad cardiaca, temperatura y biomarcadores disponibles.',
    result: 'Señalar desviaciones persistentes que justifiquen revisión médica.',
    icon: '🛡️',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    title: 'Pérdida ósea',
    info: 'Marcadores óseos, historial previo, ejercicio y mediciones disponibles.',
    result: 'Mostrar cambios en la trayectoria individual y apoyar la revisión del plan de seguimiento.',
    icon: '🦴',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
  },
  {
    title: 'Cambios cardiovasculares',
    info: 'Electrocardiograma, presión arterial, variabilidad cardiaca y respuesta postural, cuando estén disponibles.',
    result: 'Detectar cambios sostenidos y solicitar evaluación según el protocolo establecido.',
    icon: '❤️',
    color: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
  },
  {
    title: 'Bienestar psicológico y aislamiento',
    info: 'Sueño, actividad y cuestionarios voluntarios; cualquier dato sensible requiere consentimiento explícito.',
    result: 'Identificar patrones que puedan justificar apoyo, sin vigilancia encubierta ni uso punitivo.',
    icon: '🧠',
    color: 'from-purple-500/20 to-violet-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    title: 'Factores ambientales',
    info: 'Temperatura, dióxido de carbono, ruido, radiación y calendario de tareas.',
    result: 'Ayudar a contextualizar cambios fisiológicos y evitar atribuirlos sin evidencia a una sola causa.',
    icon: '🌡️',
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
  },
];

export default function Surveillance() {
  return (
    <section id="surveillance" className="relative py-24 px-6">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <span className="text-xs text-purple-300 font-medium">SECCIÓN 5</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Áreas de Vigilancia
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Los riesgos descritos son áreas de investigación para el prototipo. No constituyen diagnósticos automáticos.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, index) => (
            <div
              key={area.title}
              className={`relative p-6 rounded-2xl border ${area.borderColor} bg-gradient-to-br ${area.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 ${
                index === areas.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Icon */}
              <div className="text-3xl mb-4">{area.icon}</div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-100 mb-3">{area.title}</h3>
              
              {/* Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Datos analizados</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{area.info}</p>
              </div>

              {/* Result */}
              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-xs uppercase tracking-wider text-emerald-400/70 font-medium">Resultado esperado</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{area.result}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            La selección de variables, los umbrales y las acciones clínicas deberán ser revisados por especialistas.
          </p>
        </div>
      </div>
    </section>
  );
}
