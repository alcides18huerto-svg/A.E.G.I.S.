import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  Cpu,
  LayoutDashboard,
  Scan,
  Satellite,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export type SectionId =
  | 'overview'
  | 'hologram'
  | 'sensors'
  | 'alerts'
  | 'quality'
  | 'mission'
  | 'control';

interface SectionDef {
  id: SectionId;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export const SECTIONS: SectionDef[] = [
  { id: 'overview', label: 'Panel general', desc: 'Estado operacional y tripulación', icon: LayoutDashboard },
  { id: 'hologram', label: 'Holograma biomédico', desc: 'Gemelo digital 3D y signos vitales', icon: Scan },
  { id: 'sensors', label: 'Sensores y análisis', desc: 'Telemetría fisiológica y áreas de vigilancia', icon: Activity },
  { id: 'alerts', label: 'Alertas', desc: 'Reglas de seguridad y anomalías del motor IA', icon: Bell },
  { id: 'quality', label: 'Calidad de datos', desc: 'Integridad de sensores y pipeline', icon: ShieldCheck },
  { id: 'mission', label: 'Misión y bloques', desc: 'Pipeline en vivo y línea de tiempo', icon: Satellite },
  { id: 'control', label: 'Control del sistema', desc: 'Motor, configuración y simulación', icon: Settings },
];

interface Props {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  open: boolean;
  onClose: () => void;
  isRunning: boolean;
  isOnline: boolean;
  syncQueue: number;
  activeAlerts: number;
  criticalAlerts: number;
}

export default function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  isRunning,
  isOnline,
  syncQueue,
  activeAlerts,
  criticalAlerts,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            AG
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight text-white">A.E.G.I.S.</h1>
            <p className="truncate text-[11px] text-slate-500">Monitorización en vuelo espacial</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Secciones del sistema">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Navegación
          </p>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            const badge = section.id === 'alerts' && activeAlerts > 0 ? activeAlerts : null;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  onNavigate(section.id);
                  onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-500/25 text-indigo-200' : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{section.label}</span>
                  <span className="block truncate text-[10px] text-slate-500">{section.desc}</span>
                </span>
                {badge !== null && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      criticalAlerts > 0 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              <Cpu size={13} />
              Estado del sistema
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
                  Motor
                </span>
                <span className={isRunning ? 'text-emerald-300' : 'text-slate-500'}>
                  {isRunning ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-400">
                  {isOnline ? <Wifi size={13} className="text-cyan-300" /> : <WifiOff size={13} className="text-amber-300" />}
                  Enlace
                </span>
                <span className={isOnline ? 'text-cyan-300' : 'text-amber-300'}>
                  {isOnline ? 'En línea' : `Offline · cola ${syncQueue}`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-400">
                  <Bell size={13} />
                  Alertas
                </span>
                <span className={activeAlerts > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                  {activeAlerts} activas
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-600">A.E.G.I.S. · v1.0</p>
        </div>
      </aside>
    </>
  );
}
