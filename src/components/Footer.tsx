export default function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AG</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-200">A.E.G.I.S.</h3>
                <p className="text-xs text-slate-500">Adaptive Environmental & Guardian Intelligence System</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Prototipo de sistema de monitorización de salud para tripulación en vuelo espacial.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Secciones</h4>
            <ul className="space-y-2">
              {[
                { label: 'Arquitectura', href: '#architecture' },
                { label: 'Áreas de Vigilancia', href: '#surveillance' },
                { label: 'Privacidad y Seguridad', href: '#privacy' },
                { label: 'Organización', href: '#organization' },
                { label: 'Riesgos', href: '#risks' },
                { label: 'Próximos Pasos', href: '#nextsteps' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-slate-500 hover:text-indigo-300 transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Estado</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-slate-400">Fase: Propuesta de prototipo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-sm text-slate-400">Validación clínica: Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-sm text-slate-400">Certificación de vuelo: No aplica</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Plan Técnico · Versión explicativa · Propuesta de prototipo
          </p>
          <p className="text-xs text-slate-600">
            No equivale a validación clínica o certificación de vuelo
          </p>
        </div>
      </div>
    </footer>
  );
}
