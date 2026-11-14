import { useEffect, useMemo, useState } from 'react';
import './HologramScene.css';
import AnatomyScene from '../hologram/anatomy/AnatomyScene';
import {
  DEFAULT_VISIBLE,
  type Atlas,
  type SceneState,
  type SystemId,
  type View,
} from '../hologram/anatomy/core/anatomy';
import { staticAssetUrl } from '../hologram/anatomy/core/static-asset';
import {
  SELECTION_COLORS,
  SELECTION_COLOR_STORAGE_KEY,
  readSelectionColor,
  selectionColorPreset,
  type SelectionColorId,
} from '../hologram/anatomy/core/selection-colors';

export interface HologramZoneState {
  id: string;
  color: string;
  active: boolean;
  selected: boolean;
  severity?: string;
}

interface Props {
  zones: HologramZoneState[];
  onSelectZone: (id: string) => void;
}

const BRAIN_PATTERN = /brain|cerebr|cerebell|brainstem|medulla|pons|thalamus|hypothalamus/i;
const SEVERITY_RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const VIEWS: { id: View; label: string }[] = [
  { id: 'three-quarter', label: '3/4' },
  { id: 'front', label: 'Frente' },
  { id: 'side', label: 'Lado' },
  { id: 'back', label: 'Atrás' },
];

function matchesZone(part: { name: string; system: SystemId }, zoneId: string): boolean {
  switch (zoneId) {
    case 'brain':
      return part.system === 'nervous' && BRAIN_PATTERN.test(part.name);
    case 'heart':
      return part.system === 'cardiac';
    case 'lungs':
      return part.system === 'respiratory';
    case 'core':
      return part.system === 'digestive' || part.system === 'urinary' || part.system === 'endocrine';
    case 'bones':
      return part.system === 'skeletal';
    default:
      return false;
  }
}

function zoneForPart(part: { name: string; system: SystemId }): string | null {
  if (part.system === 'nervous' && BRAIN_PATTERN.test(part.name)) return 'brain';
  if (part.system === 'cardiac') return 'heart';
  if (part.system === 'respiratory') return 'lungs';
  if (part.system === 'skeletal') return 'bones';
  if (part.system === 'digestive' || part.system === 'urinary' || part.system === 'endocrine') return 'core';
  return null;
}

function selectionColorFor(zones: HologramZoneState[]): SelectionColorId {
  const highest = zones
    .filter((zone) => zone.active || zone.selected)
    .reduce((rank, zone) => Math.max(rank, SEVERITY_RANK[zone.severity ?? 'normal'] ?? 0), 0);
  if (highest >= 3) return 'critical';
  if (highest >= 2) return 'warning';
  return 'nominal';
}

export default function HologramScene({ zones, onSelectZone }: Props) {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [atlasError, setAtlasError] = useState<string | null>(null);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [panelOpen, setPanelOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640);
  const [rotate, setRotate] = useState(true);
  const [explode, setExplode] = useState(0);
  const [view, setView] = useState<View>('three-quarter');
  const [reset, setReset] = useState(0);
  const [customSelectionColor, setCustomSelectionColor] = useState<SelectionColorId | null>(() => readSelectionColor());

  const renderQuality = useMemo<NonNullable<SceneState['renderQuality']>>(
    () => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'smooth' : 'balanced'),
    [],
  );
  const visibleSystems = useMemo<SystemId[]>(
    () => DEFAULT_VISIBLE.filter((system) => system !== 'muscular'),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(staticAssetUrl('/models/atlas.json'), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`No se pudo descargar el catálogo anatómico (${response.status}).`);
        }
        const data = (await response.json()) as Atlas;
        if (!data || !Array.isArray(data.parts) || !Array.isArray(data.chunks)) {
          throw new Error('El catálogo anatómico no tiene el formato esperado.');
        }
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) setAtlas(data);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setAtlasError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo anatómico.');
      });
    return () => controller.abort();
  }, []);

  const selectedPartIds = useMemo(() => {
    if (!atlas) return [];
    const highlighted = zones.filter((zone) => zone.active || zone.selected);
    if (highlighted.length === 0) return [];
    const ids = new Set<string>();
    for (const part of atlas.parts) {
      if (highlighted.some((zone) => matchesZone(part, zone.id))) ids.add(part.id);
    }
    return Array.from(ids);
  }, [atlas, zones]);

  const sceneState = useMemo<SceneState>(
    () => ({
      explode,
      visible: visibleSystems,
      selected: selectedPartIds,
      isolate: false,
      view,
      rotate,
      reset,
      showBase: false,
      renderQuality,
      selectionColor: customSelectionColor ?? selectionColorFor(zones),
      rotationSpeed: 0.6,
    }),
    [customSelectionColor, explode, renderQuality, reset, rotate, selectedPartIds, view, visibleSystems, zones],
  );

  const handleSelect = (partId: string) => {
    const part = atlas?.parts.find((candidate) => candidate.id === partId);
    if (!part) return;
    const zoneId = zoneForPart(part);
    if (zoneId) onSelectZone(zoneId);
  };

  const handleReset = () => {
    setExplode(0);
    setView('three-quarter');
    setRotate(true);
    setReset((value) => value + 1);
  };

  const handleSelectionColorChange = (hex: string) => {
    const preset = SELECTION_COLORS.find((candidate) => candidate.color === hex) ?? SELECTION_COLORS[0];
    setCustomSelectionColor(preset.id);
    try {
      window.localStorage.setItem(SELECTION_COLOR_STORAGE_KEY, preset.id);
    } catch {
    }
  };

  const error = atlasError ?? sceneError;
  const selectionPreset = selectionColorPreset(customSelectionColor ?? selectionColorFor(zones));
  const loading = !error && (!atlas || progress < 100);
  const activeZones = zones.filter((zone) => zone.active).length;

  return (
    <div className="hologram-view">
      <div className="hologram-stage">
        <div className="hologram-beam" aria-hidden="true" />
        {atlas && !error && (
          <AnatomyScene
            atlas={atlas}
            state={sceneState}
            onSelect={handleSelect}
            onProgress={setProgress}
            onError={setSceneError}
          />
        )}

        {loading && (
          <div className="hologram-fallback" role="status">
            <span>CARGANDO ANATOMÍA 3D…</span>
            <span>{atlas ? `${progress}%` : 'Descargando catálogo anatómico'}</span>
            <div className="hologram-progress"><i style={{ width: `${Math.max(4, progress)}%` }} /></div>
          </div>
        )}

        {error && (
          <div className="hologram-fallback" role="alert">
            <span>{atlasError ? 'No se pudo cargar el holograma anatómico.' : 'El visor anatómico se detuvo.'}</span>
            <span className="hologram-fallback-detail">{error}</span>
            <button type="button" className="hologram-fallback-action" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )}

        <div className="hologram-hud hologram-hud-top">
          <span><i /> A.E.G.I.S. · ANATOMÍA 3D</span>
          <span>3D / {activeZones > 0 ? 'ALERTA' : 'EN LÍNEA'}</span>
        </div>
        <div className="hologram-hud hologram-hud-bottom">
          <span>ARRASTRA PARA ROTAR · RUEDA PARA ZOOM · CLIC PARA INSPECCIONAR</span>
          <span>{selectedPartIds.length} estructuras resaltadas</span>
        </div>

        <div className={`hologram-panel ${panelOpen ? 'is-open' : ''}`} aria-label="Panel de control del holograma">
          <button type="button" className="hologram-panel-toggle" onClick={() => setPanelOpen((value) => !value)} aria-label={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}>
            {panelOpen ? '✕' : '⚙'} <span>ANATOMÍA</span>
          </button>
          {panelOpen && (
            <div className="hologram-panel-body">
              <div className="hologram-panel-row">
                <span>Rotación automática</span>
                <button
                  type="button"
                  className={`hologram-toggle ${rotate ? 'is-on' : ''}`}
                  aria-pressed={rotate}
                  onClick={() => setRotate((value) => !value)}
                >
                  {rotate ? 'ACTIVA' : 'PAUSA'}
                </button>
              </div>
              <label>
                <span>Explosión de capas · {(explode * 100).toFixed(0)}%</span>
                <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
              </label>
              <div className="hologram-view-buttons" aria-label="Orientación de la vista">
                {VIEWS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={view === option.id ? 'is-active' : ''}
                    aria-pressed={view === option.id}
                    onClick={() => setView(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label>
                <span>Color de selección</span>
                <span className="hologram-panel-color">
                  <input
                    type="color"
                    value={selectionPreset.color}
                    onChange={(event) => handleSelectionColorChange(event.target.value)}
                    aria-label="Color de selección"
                  />
                  <span className="hologram-panel-color-name">{selectionPreset.name}</span>
                </span>
              </label>
              <button type="button" className="hologram-panel-reset" onClick={handleReset}>Restablecer vista</button>
              <a
                className="hologram-credit"
                href={staticAssetUrl('/models/ATTRIBUTION-anatolume.md')}
                target="_blank"
                rel="noreferrer"
              >
                Modelo: BodyParts3D · CC BY 4.0
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
