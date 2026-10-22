const steps = [
  {
    step: 1,
    title: 'Matriz de riesgo y acción',
    description: 'Relacionar cada riesgo prioritario con las señales disponibles, el método de análisis, el tipo de alerta y la respuesta humana esperada.',
  },
  {
    step: 2,
    title: 'Revisión clínica',
    description: 'Identificar un asesor médico o revisor clínico que ayude a revisar los requisitos y los límites de interpretación.',
  },
  {
    step: 3,
    title: 'Selección de datos',
    description: 'Elegir un conjunto de datos apropiado, verificar sus condiciones de uso y documentar qué fenómenos representa y cuáles no.',
  },
  {
    step: 4,
    title: 'Modelo de referencia',
    description: 'Implementar y evaluar primero un método sencillo de detección de anomalías para contar con una comparación objetiva.',
  },
  {
    step: 5,
    title: 'Criterios de éxito',
    description: 'Acordar métricas, umbrales de aceptación y condiciones de fallo antes de comparar modelos más complejos.',
  },
];

export default function NextSteps() {
  return (
    <section id="nextsteps" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <span className="text-xs text-cyan-300 font-medium">SECCIÓN 11</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Próximos Pasos
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Las primeras actividades deben reducir incertidumbres antes de ampliar el desarrollo. 
            Comenzar por el alcance y los datos, no por construir un modelo complejo.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-indigo-500/50 to-purple-500/50" />
          
          <div className="space-y-8">
            {steps.map((item) => (
              <div key={item.step} className="relative flex gap-6 group">
                {/* Step number */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    <span className="text-lg font-bold text-cyan-300">{item.step}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 group-hover:border-cyan-500/20 group-hover:bg-slate-900/80 transition-all">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">Paso {item.step}. {item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
