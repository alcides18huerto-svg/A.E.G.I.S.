const roles = [
  {
    title: 'Líder técnico o de sistemas',
    responsibility: 'Coordinar requisitos, arquitectura, riesgos, entregables y decisiones entre disciplinas.',
    icon: '👤',
  },
  {
    title: 'Especialistas en aprendizaje automático (×2)',
    responsibility: 'Preparar datos, comparar modelos, evaluar resultados y documentar límites.',
    icon: '🤖',
  },
  {
    title: 'Ingeniero de sistemas integrados',
    responsibility: 'Implementar la adquisición de señales, el procesamiento local y la ejecución eficiente.',
    icon: '⚙️',
  },
  {
    title: 'Desarrollador de interfaz',
    responsibility: 'Construir la aplicación, los paneles, la presentación de alertas y la experiencia de uso.',
    icon: '💻',
  },
  {
    title: 'Especialista en factores humanos',
    responsibility: 'Revisar claridad, carga de alertas, interacción y comprensión de mensajes.',
    icon: '🧩',
  },
  {
    title: 'Asesor médico o revisor clínico',
    responsibility: 'Revisar requisitos, interpretación de alertas, límites clínicos y criterios de seguridad.',
    icon: '🏥',
  },
];

const documentation = [
  { title: 'Gestión de datos', desc: 'Datos originales, procesados, metadatos y controles de calidad, con acceso restringido.' },
  { title: 'Entrenamiento y evaluación', desc: 'Experimentos, resultados comparativos, criterios de selección y registros de validación.' },
  { title: 'Modelos aprobados', desc: 'Versiones identificadas, umbrales calibrados, documentación y limitaciones conocidas.' },
  { title: 'Aplicación e integración', desc: 'Componentes de captura, análisis, reglas de seguridad e interfaz.' },
  { title: 'Documentación', desc: 'Requisitos, decisiones de arquitectura, análisis de riesgos, privacidad, pruebas y resultados.' },
];

export default function Organization() {
  return (
    <section id="organization" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <span className="text-xs text-violet-300 font-medium">SECCIÓN 9</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Organización del Proyecto
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Equipo mínimo propuesto con perfiles técnicos y clínicos.
          </p>
        </div>

        {/* Team roles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {roles.map((role) => (
            <div
              key={role.title}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{role.icon}</span>
                <h3 className="text-base font-semibold text-slate-100">{role.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{role.responsibility}</p>
            </div>
          ))}
        </div>

        {/* Documentation structure */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-slate-200 mb-6 text-center">
            Organización documental recomendada
          </h3>
          <div className="grid gap-3 md:grid-cols-5">
            {documentation.map((doc, index) => (
              <div
                key={doc.title}
                className="relative p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 transition-colors"
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-300">{index + 1}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1 mt-2">{doc.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
