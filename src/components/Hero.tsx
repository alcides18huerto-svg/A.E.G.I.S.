export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-indigo-300 font-medium tracking-wide">PLAN TÉCNICO · VERSIÓN EXPLICATIVA</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
            A.E.G.I.S.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 mb-4 font-light">
          Adaptive Environmental & Guardian Intelligence System
        </p>
        
        <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          Prototipo de sistema de monitorización de salud para tripulación en vuelo espacial.
          Detección temprana de anomalías fisiológicas con operación offline-first y supervisión humana.
        </p>

        {/* Disclaimer */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-amber-200/80">
            Propuesta de prototipo · No equivale a validación clínica o certificación de vuelo
          </span>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-widest">Explorar</span>
          <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-indigo-400 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
