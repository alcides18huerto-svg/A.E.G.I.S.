export default function Pitch() {
  return (
    <section id="pitch" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <span className="text-xs text-amber-300 font-medium">PITCH TÉCNICO</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Visión del Proyecto
            </span>
          </h2>
        </div>

        {/* Main pitch card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 border border-indigo-500/20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Quote mark */}
              <div className="text-6xl text-indigo-500/30 font-serif leading-none mb-4">"</div>
              
              <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light mb-8">
                A.E.G.I.S. no pretende diagnosticar a un astronauta con una única red neuronal. 
                Busca aprender qué patrón es habitual para cada tripulante, combinar esa referencia 
                con modelos fisiológicos y detectar desviaciones tempranas con una estimación explícita 
                de incertidumbre.
              </p>
              
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                El sistema está diseñado para operar localmente y mantener un canal de seguridad 
                independiente que la inteligencia artificial no puede anular.
              </p>

              {/* Key points */}
              <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">Referencia individual</h4>
                  <p className="text-xs text-slate-500">Patrón personalizado por tripulante</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">Offline-first</h4>
                  <p className="text-xs text-slate-500">Operación local sin dependencia</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">Seguridad independiente</h4>
                  <p className="text-xs text-slate-500">Reglas clínicas no anulables por IA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scope and limits */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <h3 className="text-xl font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Alcance y límites
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Este plan describe una propuesta de investigación y desarrollo de prototipo. Antes de cualquier uso operativo, 
              será necesario completar validaciones técnicas, evaluación clínica, pruebas de factores humanos, análisis de 
              ciberseguridad y los procesos de autorización o certificación que correspondan. El cronograma de 36 semanas 
              es una planificación inicial y puede cambiar según los datos, el equipo, el hardware y los resultados de las pruebas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
