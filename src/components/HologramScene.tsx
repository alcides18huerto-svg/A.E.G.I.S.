import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import './HologramScene.css';
import * as THREE from 'three';

export interface HologramZoneState {
  id: string;
  color: string;
  active: boolean;
  selected: boolean;
}

interface Props {
  zones: HologramZoneState[];
  onSelectZone: (id: string) => void;
}

const ZONE_POSITIONS: Record<string, THREE.Vector3> = {
  brain: new THREE.Vector3(0, 5.2, 0),
  heart: new THREE.Vector3(0.18, 3.55, 0.42),
  lungs: new THREE.Vector3(0, 3.72, 0.36),
  core: new THREE.Vector3(0, 2.8, 0.4),
  bones: new THREE.Vector3(0, 1.15, 0.32),
  env: new THREE.Vector3(2.05, 3.1, 0),
};

function addHologramMesh(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  scale = new THREE.Vector3(1, 1, 1),
) {
  const surface = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: '#16c9e8',
      transparent: true,
      opacity: 0.075,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  surface.position.copy(position);
  surface.scale.copy(scale);
  parent.add(surface);

  const wireframe = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: '#4deaff',
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  wireframe.position.copy(position);
  wireframe.scale.copy(scale);
  parent.add(wireframe);
}

function addLimbSegment(
  parent: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  startRadius: number,
  endRadius: number,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const geometry = new THREE.CylinderGeometry(endRadius, startRadius, direction.length(), 10, 5, true);
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: '#25d8f2',
      wireframe: true,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  mesh.position.copy(position);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  parent.add(mesh);

  const joint = new THREE.Mesh(
    new THREE.IcosahedronGeometry(startRadius * 0.72, 1),
    new THREE.MeshBasicMaterial({ color: '#72f3ff', wireframe: true, transparent: true, opacity: 0.55 }),
  );
  joint.position.copy(start);
  parent.add(joint);
}

function createBody(parent: THREE.Group) {
  const torsoProfile = [
    new THREE.Vector2(0.28, 0),
    new THREE.Vector2(0.4, 0.12),
    new THREE.Vector2(0.42, 0.42),
    new THREE.Vector2(0.56, 0.78),
    new THREE.Vector2(0.74, 1.2),
    new THREE.Vector2(0.67, 1.55),
    new THREE.Vector2(0.48, 1.86),
    new THREE.Vector2(0.33, 2.06),
  ];
  addHologramMesh(parent, new THREE.LatheGeometry(torsoProfile, 18), new THREE.Vector3(0, 2.75, 0));
  addHologramMesh(
    parent,
    new THREE.SphereGeometry(0.43, 16, 12),
    new THREE.Vector3(0, 5.22, 0),
    new THREE.Vector3(0.82, 1.18, 0.88),
  );
  addHologramMesh(
    parent,
    new THREE.CylinderGeometry(0.2, 0.24, 0.4, 12, 4, true),
    new THREE.Vector3(0, 4.77, 0),
  );
  addHologramMesh(
    parent,
    new THREE.SphereGeometry(0.48, 14, 10),
    new THREE.Vector3(0, 2.84, 0),
    new THREE.Vector3(1.35, 0.72, 0.82),
  );

  const limbSets = [
    { points: [[-0.58, 4.48, 0], [-0.98, 3.78, 0], [-1.22, 3.02, 0.03], [-1.28, 2.22, 0.1]], radius: [0.2, 0.15, 0.12] },
    { points: [[0.58, 4.48, 0], [0.98, 3.78, 0], [1.22, 3.02, 0.03], [1.28, 2.22, 0.1]], radius: [0.2, 0.15, 0.12] },
    { points: [[-0.32, 2.72, 0], [-0.4, 1.72, 0], [-0.43, 0.78, 0.02], [-0.46, 0.16, 0.14]], radius: [0.25, 0.17, 0.12] },
    { points: [[0.32, 2.72, 0], [0.4, 1.72, 0], [0.43, 0.78, 0.02], [0.46, 0.16, 0.14]], radius: [0.25, 0.17, 0.12] },
  ];

  limbSets.forEach(({ points, radius }) => {
    const joints = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    for (let index = 0; index < joints.length - 1; index += 1) {
      addLimbSegment(parent, joints[index], joints[index + 1], radius[index], radius[index] * 0.78);
    }
  });

  const spine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 2.7, 6, 18),
    new THREE.MeshBasicMaterial({ color: '#8bf6ff', wireframe: true, transparent: true, opacity: 0.68 }),
  );
  spine.position.set(0, 3.55, 0.18);
  parent.add(spine);

  const heart = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.23, 2),
    new THREE.MeshBasicMaterial({ color: '#54efff', wireframe: true, transparent: true, opacity: 0.95 }),
  );
  heart.position.set(0.18, 3.55, 0.42);
  heart.scale.set(0.78, 1.05, 0.65);
  heart.name = 'hologram-heart';
  parent.add(heart);

  [-1, 1].forEach((side) => {
    const lung = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 10),
      new THREE.MeshBasicMaterial({ color: '#3bdcf4', wireframe: true, transparent: true, opacity: 0.55 }),
    );
    lung.position.set(side * 0.34, 3.8, 0.36);
    lung.scale.set(0.68, 1.12, 0.55);
    parent.add(lung);
  });
}

export default function HologramScene({ zones, onSelectZone }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  const dragRef = useRef({ x: 0, y: 0, moved: false });
  const [rotation, setRotation] = useState(0);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(7.5, 4.7, 9.5);
    camera.lookAt(0, 2.75, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
      console.error('No se pudo iniciar el renderizado 3D del holograma.', error);
      setRenderError(true);
      return;
    }

    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x020617, 0);
    renderer.domElement.setAttribute('aria-label', 'Modelo holográfico 3D interactivo del cuerpo humano');
    renderer.domElement.className = 'hologram-canvas';
    host.prepend(renderer.domElement);

    const model = new THREE.Group();
    modelRef.current = model;
    scene.add(model);
    createBody(model);

    const grid = new THREE.GridHelper(8, 32, 0x12677a, 0x0b2d42);
    grid.position.y = 0.02;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.38;
    });
    scene.add(grid);

    [0.85, 1.3, 1.75].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.008, 4, 96),
        new THREE.MeshBasicMaterial({ color: index === 1 ? '#35e8f5' : '#167e98', transparent: true, opacity: 0.62 - index * 0.12 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08 + index * 0.025;
      ring.name = `projection-ring-${index}`;
      scene.add(ring);
    });

    const zoneTargets: THREE.Mesh[] = [];
    Object.entries(ZONE_POSITIONS).forEach(([id, position]) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 12, 10),
        new THREE.MeshBasicMaterial({ color: '#55eaff', transparent: true, opacity: 0.12, depthWrite: false }),
      );
      marker.position.copy(position);
      marker.userData.zoneId = id;
      marker.name = `zone-${id}`;
      model.add(marker);
      zoneTargets.push(marker);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(id === 'lungs' ? 0.34 : 0.25, 0.012, 5, 48),
        new THREE.MeshBasicMaterial({ color: '#48e9ff', transparent: true, opacity: 0.8 }),
      );
      ring.position.copy(position);
      ring.name = `zone-ring-${id}`;
      if (id === 'env') ring.rotation.y = Math.PI / 2;
      else ring.rotation.x = Math.PI / 2;
      model.add(ring);
    });
    targetRef.current = zoneTargets;

    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.multiplyScalar(event.deltaY > 0 ? 1.08 : 0.92);
      camera.position.clampLength(6.5, 18);
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    renderer.setAnimationLoop((time) => {
      const elapsed = time / 1000;
      model.scale.y = 1 + Math.sin(elapsed * 1.5) * 0.004;
      model.getObjectByName('hologram-heart')?.scale.set(
        0.78 + Math.sin(elapsed * 4) * 0.025,
        1.05 + Math.sin(elapsed * 4) * 0.035,
        0.65,
      );
      scene.getObjectByName('projection-ring-1')!.rotation.z = elapsed * 0.12;
      renderer.render(scene, camera);
    });

    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      modelRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      targetRef.current = [];
      raycasterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    zones.forEach((zone) => {
      const marker = model.getObjectByName(`zone-${zone.id}`);
      const ring = model.getObjectByName(`zone-ring-${zone.id}`);
      if (!(marker instanceof THREE.Mesh) || !(ring instanceof THREE.Mesh)) return;
      const color = new THREE.Color(zone.color);
      const markerMaterial = marker.material as THREE.MeshBasicMaterial;
      const ringMaterial = ring.material as THREE.MeshBasicMaterial;
      markerMaterial.color.copy(color);
      markerMaterial.opacity = zone.selected ? 0.55 : zone.active ? 0.36 : 0.12;
      ringMaterial.color.copy(color);
      ringMaterial.opacity = zone.selected ? 1 : zone.active ? 0.95 : 0.4;
      ring.scale.setScalar(zone.selected ? 1.24 : zone.active ? 1.12 : 1);
    });
  }, [zones]);

  const rotateBy = (amount: number) => {
    const model = modelRef.current;
    if (!model) return;
    model.rotation.y += amount;
    setRotation(Math.round(THREE.MathUtils.radToDeg(model.rotation.y)));
  };

  const resetView = () => {
    const model = modelRef.current;
    const camera = cameraRef.current;
    if (!model || !camera) return;
    model.rotation.set(0, 0, 0);
    camera.position.set(7.5, 4.7, 9.5);
    camera.lookAt(0, 2.75, 0);
    setRotation(0);
  };

  const zoom = (factor: number) => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.multiplyScalar(factor);
    camera.position.clampLength(6.5, 18);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    dragRef.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) dragRef.current.moved = true;
    const model = modelRef.current;
    if (!model) return;
    model.rotation.y += deltaX * 0.008;
    model.rotation.x = THREE.MathUtils.clamp(model.rotation.x + deltaY * 0.004, -0.3, 0.3);
    setRotation(Math.round(THREE.MathUtils.radToDeg(model.rotation.y)));
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const raycaster = raycasterRef.current;
    if (!dragRef.current.moved && renderer && camera && raycaster) {
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(targetRef.current)[0];
      if (hit) onSelectZoneRef.current(hit.object.userData.zoneId as string);
    }
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  };

  return (
    <div className="hologram-view">
      <div
        ref={hostRef}
        className="hologram-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {renderError && (
          <div className="hologram-fallback" role="status">
            <span>El navegador no pudo iniciar el renderizado 3D.</span>
            <span>Prueba con aceleración gráfica habilitada.</span>
          </div>
        )}
        <div className="hologram-hud hologram-hud-top">
          <span><i /> A.E.G.I.S. · HOLOSCAN</span>
          <span>3D / {zones.some((zone) => zone.active) ? 'ALERTA' : 'EN LÍNEA'}</span>
        </div>
        <div className="hologram-hud hologram-hud-bottom">
          <span>ARRASTRA PARA ROTAR · RUEDA PARA ZOOM</span>
          <span>{rotation}°</span>
        </div>
        <div className="hologram-controls" aria-label="Controles de vista 3D">
          <button type="button" onClick={() => rotateBy(-Math.PI / 8)} aria-label="Girar a la izquierda">↶</button>
          <button type="button" onClick={() => rotateBy(Math.PI / 8)} aria-label="Girar a la derecha">↷</button>
          <button type="button" onClick={() => zoom(0.88)} aria-label="Acercar">+</button>
          <button type="button" onClick={() => zoom(1.14)} aria-label="Alejar">−</button>
          <button type="button" onClick={resetView} aria-label="Restablecer vista">Reset</button>
        </div>
      </div>
    </div>
  );
}
