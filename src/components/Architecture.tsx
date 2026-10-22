const stages = [
  {
    number: '01',
    title: 'Captura de datos',
    description: 'Los sensores y registros autorizados aportan señales como frecuencia cardiaca, actividad, sueño y otros indicadores disponibles. Los datos deben contar con marca temporal y procedencia identificable.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    number: '02',
    title: 'Validación y control de calidad',
    description: 'El sistema revisa valores faltantes, señales degradadas, marcas temporales incorrectas y posibles fallos de sensores. Los datos dudosos se identifican y no se tratan automáticamente como mediciones válidas.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    number: '03',
    title: 'Referencia individual',
    description: 'Se establece un patrón de referencia para cada tripulante usando periodos adecuados y revisados. La referencia debe tener en cuenta el contexto, como ejercicio, descanso, horarios y actividades especiales.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    number: '04',
    title: 'Análisis de anomalías y tendencias',
    description: 'Los modelos comparan las nuevas observaciones con el patrón individual, examinan cambios persistentes y estiman si hay información suficiente para emitir una alerta.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    number: '05',
    title: 'Reglas de seguridad independientes',
    description: 'Las reglas clínicas aprobadas operan por separado del motor predictivo. Si se cumple una condición crítica, se activa la respuesta establecida sin esperar a la IA.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    number: '06',
    title: 'Interfaz de la tripulación',
    description: 'La interfaz muestra el tipo de alerta, su motivo, el grado de confianza, la calidad de los datos y el procedimiento recomendado para revisión humana.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    color: 'from-cyan-500 to-sky-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  {
    number: '07',
    title: 'Almacenamiento y comunicación',
    description: 'El sistema conserva registros localmente y transmite, cuando corresponda, resúmenes y alertas. La comunicación con la Tierra complementa el funcionamiento, pero no es requisito para las funciones críticas.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <span className="text-xs text-indigo-300 font-medium">SECCIÓN 4</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Arquitectura General
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Flujo de información organizado como una cadena de etapas con trazabilidad completa.
          </p>
        </div>

        {/* Pipeline visualization */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-indigo-500/50 hidden md:block" />
          
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.number} className="relative group">
                {/* Timeline dot */}
                <div className="absolute left-6 top-8 w-4 h-4 rounded-full border-2 border-slate-700 bg-slate-900 hidden md:block group-hover:border-indigo-400 transition-colors z-10">
                  <div className={`absolute inset-1 rounded-full bg-gradient-to-r ${stage.color}`} />
                </div>

                {/* Card */}
                <div className={`md:ml-16 p-6 rounded-2xl border ${stage.borderColor} ${stage.bgColor} backdrop-blur-sm hover:scale-[1.01] transition-all duration-300`}>
                  <div className="flex items-start gap-4">
                    {/* Number badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r ${stage.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-sm">{stage.number}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-slate-400">{stage.icon}</div>
                        <h3 className="text-xl font-semibold text-slate-100">{stage.title}</h3>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{stage.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline-first callout */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 border border-cyan-500/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-cyan-300 mb-1">Diseño offline-first</h4>
              <p className="text-slate-400 leading-relaxed">
                Las funciones críticas deben continuar operativas sin conexión. Cuando el enlace vuelva a estar disponible, 
                la transferencia se reanudará siguiendo reglas de integridad, prioridad y privacidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
