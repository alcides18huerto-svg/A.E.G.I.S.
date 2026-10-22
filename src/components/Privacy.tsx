const privacyItems = [
  {
    title: 'Operación sin conexión',
    description: 'El registro, los controles de calidad, la evaluación local y las alertas críticas deben funcionar aunque no exista comunicación con la Tierra. Cuando la conexión se recupere, el sistema podrá transmitir información resumida según prioridades predefinidas. No se propone enviar vídeo, audio ni señales biométricas sin procesar por defecto.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    title: 'Actualizaciones controladas',
    description: 'Cada versión del modelo debe estar identificada, verificada y acompañada de documentación. La instalación debe permitir volver a una versión anterior si las pruebas detectan un problema. No se deben instalar actualizaciones predictivas de forma automática sin revisión y autorización apropiadas.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    title: 'Privacidad y consentimiento',
    description: 'Los datos relacionados con salud y bienestar son sensibles. El acceso debe limitarse por función, quedar registrado y tener una finalidad clara. Cualquier uso de voz, expresiones o indicadores de bienestar psicológico debe requerir consentimiento explícito, permitir opciones informadas y prohibir el uso punitivo o la vigilancia encubierta.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
  {
    title: 'Tolerancia a fallos',
    description: 'El sistema debe reconocer pérdida de sensores, datos corruptos, interrupciones de comunicación y errores de ejecución. Ante una condición degradada, debe informar de la limitación y mantener las funciones de seguridad independientes. La ejecución en un equipo informático no equivale por sí sola a una certificación para vuelo espacial.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
];

export default function Privacy() {
  return (
    <section id="privacy" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <span className="text-xs text-emerald-300 font-medium">SECCIÓN 8</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Operación, Privacidad y Seguridad
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Principios fundamentales que rigen el funcionamiento autónomo y la protección de datos.
          </p>
        </div>

        {/* Privacy cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {privacyItems.map((item) => (
            <div
              key={item.title}
              className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key principles */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Consentimiento explícito', value: 'Requerido' },
            { label: 'Acceso restringido', value: 'Por función' },
            { label: 'Almacenamiento', value: 'Local primero' },
            { label: 'Auditoría', value: 'Registro completo' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <div className="text-sm font-medium text-emerald-400 mb-1">{item.value}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
