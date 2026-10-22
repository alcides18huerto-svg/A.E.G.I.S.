const risks = [
  {
    risk: 'Pocos datos por persona',
    mitigation: 'Combinar conocimiento fisiológico, modelos sencillos y datos análogos; evitar promesas de aprendizaje profundo desde cero.',
    evidence: 'Comparación con métodos base y limitaciones documentadas.',
    severity: 'high',
  },
  {
    risk: 'Demasiadas falsas alarmas',
    mitigation: 'Separar las reglas críticas, controlar el presupuesto de alertas y permitir abstención.',
    evidence: 'Tasa de falsas alarmas y resultados de pruebas de uso.',
    severity: 'high',
  },
  {
    risk: 'Cambios en el patrón fisiológico',
    mitigation: 'Revisar la referencia individual de manera controlada y supervisada.',
    evidence: 'Pruebas de deriva y registro de recalibraciones.',
    severity: 'medium',
  },
  {
    risk: 'Confianza excesiva en la IA',
    mitigation: 'Mostrar incertidumbre, exigir revisión humana y no sustituir el criterio médico.',
    evidence: 'Pruebas de comprensión y protocolo de escalamiento.',
    severity: 'high',
  },
  {
    risk: 'Riesgos de privacidad',
    mitigation: 'Consentimiento explícito, acceso restringido, almacenamiento local y auditoría.',
    evidence: 'Registro de accesos y revisión de permisos.',
    severity: 'high',
  },
  {
    risk: 'Fallos de sensores o hardware',
    mitigation: 'Detección de fallos, comprobaciones de integridad y modo seguro degradado.',
    evidence: 'Pruebas de inyección de fallos y recuperación.',
    severity: 'medium',
  },
  {
    risk: 'Exageración del alcance del gemelo digital',
    mitigation: 'Describir el alcance como un modelo individualizado limitado y documentar qué no representa.',
    evidence: 'Documento de alcance, supuestos y límites.',
    severity: 'medium',
  },
];

const severityColors = {
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

const severityLabels = {
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

export default function Risks() {
  return (
    <section id="risks" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <span className="text-xs text-red-300 font-medium">SECCIÓN 10</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Riesgos y Mitigaciones
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Identificación de riesgos, medidas de mitigación y evidencia requerida para cada uno.
          </p>
        </div>

        {/* Risk cards */}
        <div className="space-y-4">
          {risks.map((item, index) => (
            <div
              key={item.risk}
              className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all duration-300"
            >
              <div className="grid md:grid-cols-12 gap-4 items-start">
                {/* Risk */}
                <div className="md:col-span-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-600">R{String(index + 1).padStart(2, '0')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[item.severity as keyof typeof severityColors]}`}>
                      {severityLabels[item.severity as keyof typeof severityLabels]}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">{item.risk}</h3>
                </div>

                {/* Mitigation */}
                <div className="md:col-span-5">
                  <div className="text-xs uppercase tracking-wider text-slate-600 mb-1">Mitigación</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.mitigation}</p>
                </div>

                {/* Evidence */}
                <div className="md:col-span-4">
                  <div className="text-xs uppercase tracking-wider text-slate-600 mb-1">Evidencia requerida</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.evidence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Acceptance criteria */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-indigo-300 mb-2">Criterio general de aceptación</h4>
              <p className="text-slate-400 leading-relaxed">
                El prototipo se considerará listo para la siguiente etapa solo cuando los requisitos acordados tengan pruebas asociadas, 
                las limitaciones sean visibles, los fallos importantes estén evaluados y los resultados puedan ser reproducidos por otra persona del equipo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
