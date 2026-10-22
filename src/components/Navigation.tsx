interface NavigationProps {
  activeSection: string;
  scrollY: number;
}

const sections = [
  { id: 'hero', label: 'Inicio', icon: '◆' },
  { id: 'architecture', label: 'Arquitectura', icon: '⬡' },
  { id: 'surveillance', label: 'Vigilancia', icon: '◉' },
  { id: 'privacy', label: 'Privacidad', icon: '⛨' },
  { id: 'organization', label: 'Equipo', icon: '⊞' },
  { id: 'risks', label: 'Riesgos', icon: '⚠' },
  { id: 'nextsteps', label: 'Próximos Pasos', icon: '→' },
  { id: 'pitch', label: 'Pitch', icon: '★' },
];

export default function Navigation({ activeSection, scrollY }: NavigationProps) {
  const isScrolled = scrollY > 100;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AG</span>
            </div>
            <span className="font-semibold text-slate-200 hidden sm:block">A.E.G.I.S.</span>
          </div>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300">Prototipo</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
