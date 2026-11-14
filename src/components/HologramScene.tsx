import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import './HologramScene.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';

const ZONE_POSITIONS: Record<string, THREE.Vector3> = {
  brain: new THREE.Vector3(0, 5.2, 0),
  heart: new THREE.Vector3(0.18, 3.55, 0.42),
  lungs: new THREE.Vector3(0, 3.8, 0.36),
  core: new THREE.Vector3(0, 2.8, 0.4),
  bones: new THREE.Vector3(0, 1.6, 0),
  env: new THREE.Vector3(1.6, 2.75, 0),
};

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// HOLOGRAM SHADER MATERIAL (GLSL)
// --------------------------------------------
// Matemática clave:
//  · Fresnel: intensidad = pow(1 - |dot(N, V)|, uFresnelPower)
//    Cuando la normal N es perpendicular a la vista V (bordes de la
//    silueta) dot→0 y el fresnel→1 (brillo cian en el contorno);
//    cuando N apunta a la cámara (centro) dot→1 y fresnel→0
//    (centro semitransparente).
//  · Scanlines: sin(worldY * uScanDensity - uTime * uScanSpeed)
//    genera bandas horizontales que ascienden verticalmente.
//  · Glitch: hash pseudo-aleatorio de floor(uTime*6) + position.y
//    desplaza vértices en X solo durante ráfagas cortas.
// Incluye los chunks de skinning para que funcione sobre SkinnedMesh.
// ============================================

export interface HologramUniforms {
  uTime: { value: number };
  uColor: { value: THREE.Color };
  uScanSpeed: { value: number };
  uScanDensity: { value: number };
  uFresnelPower: { value: number };
  uGlitchIntensity: { value: number };
  uOpacity: { value: number };
}

function createHologramUniforms(): HologramUniforms {
  return {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00f3ff') },
    uScanSpeed: { value: 2.2 },
    uScanDensity: { value: 14.0 },
    uFresnelPower: { value: 2.0 },
    uGlitchIntensity: { value: 0.35 },
    uOpacity: { value: 0.7 },
  };
}

function createHologramMaterial(uniforms: HologramUniforms) {
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>

      uniform float uTime;
      uniform float uGlitchIntensity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPos;

      // Hash pseudo-aleatorio determinista (white-noise)
      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>

        #include <begin_vertex>
        #include <skinning_vertex>

        // --- Glitch sutil: ráfagas de ~0.12s cada ~3s ---
        float burst = floor(uTime * 0.33);            // ventana de 3s
        float burstT = fract(uTime * 0.33);           // progreso dentro de la ventana
        float burstActive = step(burstT, 0.04) * step(0.5, hash(burst)); // solo algunas ventanas
        float slice = floor(transformed.y * 6.0);     // rebanadas horizontales
        float rnd = hash(slice + burst * 13.7) - 0.5;
        transformed.x += rnd * uGlitchIntensity * burstActive * 0.35;

        vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * objectNormal);
        vec4 mvPosition = viewMatrix * worldPos;
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uScanSpeed;
      uniform float uScanDensity;
      uniform float uFresnelPower;
      uniform float uGlitchIntensity;
      uniform float uOpacity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPos;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);

        // --- Fresnel: bordes brillantes, centro transparente ---
        float fresnel = pow(1.0 - abs(dot(N, V)), uFresnelPower);

        // --- Scanlines horizontales animadas (ascienden con uTime) ---
        float scan = 0.5 + 0.5 * sin(vWorldPos.y * uScanDensity - uTime * uScanSpeed);
        scan = pow(scan, 3.0); // bandas finas, no seno completo

        // --- Línea de barrido principal (pulso vertical de escáner) ---
        float sweep = smoothstep(0.02, 0.0, abs(fract(uTime * 0.18) * 6.0 - vWorldPos.y));

        // --- Aberración cromática sutil durante glitch ---
        float aberr = uGlitchIntensity * 0.15 * sin(uTime * 40.0);

        vec3 core = uColor * 0.55;
        vec3 edge = uColor * (0.9 + fresnel * 1.8);
        vec3 color = mix(core, edge, fresnel);
        color += uColor * scan * 0.3;
        color += uColor * sweep * 1.0;
        color.r += aberr;
        color.b -= aberr;

        float alpha = uOpacity * (0.5 + fresnel * 0.35) + scan * 0.1 + sweep * 0.18;
        alpha = clamp(alpha, 0.0, 1.0);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ============================================
// PROJECTOR DISC - circular base glow under feet
// ============================================

function createProjectorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00f3ff') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0; // [-1, 1]
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        // Anillo emisor + relleno radial con pulso
        float ring = smoothstep(0.06, 0.0, abs(r - 0.82)) * 1.6;
        float inner = smoothstep(0.8, 0.0, r) * (0.35 + 0.15 * sin(uTime * 2.0));
        float grid = step(0.92, sin(atan(vUv.y, vUv.x) * 24.0)) * smoothstep(0.9, 0.2, r) * 0.35;
        float glow = ring + inner + grid;
        gl_FragColor = vec4(uColor * glow, glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// ============================================
// FRESNEL SHADER MATERIAL - translucent hologram body
// ============================================

function createFresnelMaterial(baseColor: string = '#00f0ff', edgeColor: string = '#00a8ff', centerOpacity: number = 0.08, edgeIntensity: number = 2.5) {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(baseColor) },
      edgeColor: { value: new THREE.Color(edgeColor) },
      centerOpacity: { value: centerOpacity },
      edgeIntensity: { value: edgeIntensity },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vDepth;
      void main() {
        vNormal = normal;
        vViewDir = normalize(viewMatrix * modelMatrix * vec4(position, 1.0)).xyz;
        vDepth = -position.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 edgeColor;
      uniform float centerOpacity;
      uniform float edgeIntensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vDepth;
      
      void main() {
        // Fresnel effect: intensity increases toward edges
        float fresnel = pow(1.0 - abs(dot(vNormal, normalize(vViewDir))), edgeIntensity);
        
        // Depth fade for central transparency
        float depthFade = smoothstep(0.5, 1.0, vDepth);
        
        // Mix center (transparent) with edges (colored)
        vec3 mixed = baseColor * centerOpacity + edgeColor * (1.0 - centerOpacity);
        vec3 color = mix(mixed, edgeColor, fresnel);
        
        // Apply alpha: center transparent, edges opaque
        float alpha = mix(centerOpacity, 1.0, fresnel) * depthFade;
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ============================================
// WIREFRAME LAYER MATERIAL
// ============================================

function createWireframeMaterial(color: string = '#00f0ff', opacity: number = 0.12) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    wireframe: true,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ============================================
// SCANLINE SHADER MATERIAL
// ============================================

function createScanlineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scanlineSpeed: { value: 0.3 },
      scanlineDensity: { value: 25 },
      intensity: { value: 0.25 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float scanlineSpeed;
      uniform float scanlineDensity;
      uniform float intensity;
      varying vec2 vUv;
      
      void main() {
        // Vertical scanlines
        float scanline = sin(vUv.y * scanlineDensity + time * scanlineSpeed);
        float scanlineAmp = step(0.95, abs(scanline)) * intensity;
        
        // Horizontal scanning beam (animated)
        float beam = step(0.0, sin(vUv.x * 10.0 + time * 0.5)) - step(0.99, sin(vUv.x * 10.0 + time * 0.5));
        float beamAmp = beam * 0.1;
        
        // Combine
        gl_FragColor = vec4(0.0, 0.0, 0.0, scanlineAmp + beamAmp);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

// ============================================
// REALISTIC HUMAN SILHOUETTE (front profile)
// Proportions based on adult human anatomy:
// head ~1/7.5 of height, shoulders ~2 head-widths,
// waist at ~0.58, hips ~0.52, crotch ~0.27 of height.
// ============================================

function createHumanSilhouetteShape(): THREE.Shape {
  // Right half of the outline, from the top of the head down to the crotch.
  const right: Array<[number, number]> = [
    [0.0, 5.62],   // crown
    [0.17, 5.60],  // skull
    [0.29, 5.47],  // cranium
    [0.345, 5.22], // temporal
    [0.335, 4.99], // cheekbone
    [0.27, 4.79],  // jaw
    [0.165, 4.57], // jaw-neck junction
    [0.15, 4.40],  // neck
    [0.33, 4.33],  // trapezius
    [0.60, 4.27],  // shoulder slope
    [0.81, 4.17],  // deltoid cap
    [0.895, 3.93], // deltoid
    [0.885, 3.58], // upper arm
    [0.83, 3.10],  // triceps
    [0.78, 2.66],  // elbow
    [0.80, 2.22],  // forearm
    [0.79, 1.82],  // forearm distal
    [0.72, 1.50],  // wrist
    [0.725, 1.18], // hand dorsum
    [0.66, 0.93],  // knuckles / fingertips
    [0.55, 1.00],  // inner hand
    [0.525, 1.28], // inner wrist
    [0.55, 1.76],  // inner forearm
    [0.545, 2.24], // inner elbow
    [0.505, 2.74], // inner upper arm
    [0.46, 3.14],  // inner biceps
    [0.44, 3.55],  // armpit
    [0.465, 3.38], // latissimus
    [0.425, 3.02], // waist upper
    [0.395, 2.78], // waist
    [0.45, 2.46],  // iliac crest / hip
    [0.505, 2.13], // hip / greater trochanter
    [0.475, 1.60], // thigh outer
    [0.42, 1.02],  // thigh distal
    [0.365, 0.62], // knee
    [0.335, 0.28], // calf
    [0.315, 0.05], // outer ankle
    [0.16, 0.015], // inner ankle / foot base
    [0.185, 0.46], // inner calf
    [0.21, 0.96],  // inner knee
    [0.175, 1.31], // inner thigh
    [0.075, 1.51], // perineum right
    [0.0, 1.55],   // crotch center
  ];

  const left: Array<[number, number]> = right
    .slice(0, -1)
    .map(([x, y]) => [-x, y] as [number, number])
    .reverse();

  const outline = [...right, ...left];
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  shape.splineThru(outline.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
  shape.closePath();
  return shape;
}

// ============================================
// ORGAN HIGHLIGHT MATERIAL (dynamic emissive)
// ============================================

function createOrganMaterial(baseColor: string, alertColor: string = '#ff3b30') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor),
    emissive: new THREE.Color(alertColor),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// ============================================
// BODY CREATION - anatomical wireframe hologram
// ============================================

function createBody(parent: THREE.Group, organAlerts: Map<string, boolean>) {
  // --- Realistic human silhouette (front profile), extruded with bevel ---
  const silhouette = createHumanSilhouetteShape();
  const bodyMaterial = createFresnelMaterial('#00f0ff', '#00a8ff', 0.08, 2.5);
  const bodyGeometry = new THREE.ExtrudeGeometry(silhouette, {
    depth: 0.55,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.42,
    bevelSize: 0.34,
    bevelSegments: 6,
    curveSegments: 24,
  });
  bodyGeometry.center();
  bodyGeometry.translate(0, 2.82, 0);
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.castShadow = false;
  bodyMesh.receiveShadow = false;
  parent.add(bodyMesh);

  // --- Wireframe overlay (same silhouette, slightly larger) ---
  const wireframeMaterial = createWireframeMaterial('#00f0ff', 0.1);
  const wireframeGeometry = bodyGeometry.clone();
  wireframeGeometry.scale(1.012, 1.012, 1.03);
  const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
  wireframeMesh.renderOrder = 1;
  parent.add(wireframeMesh);

  // --- Punto nube: red de partículas sobre la silueta ---
  parent.add(createBodyPointCloud());

  // --- Internal organ modules ---
  // Heart
  const heartGeo = new THREE.IcosahedronGeometry(0.23, 2);
  const heartMaterial = createOrganMaterial('#54efff', '#ff3b30');
  const heart = new THREE.Mesh(heartGeo, heartMaterial);
  heart.position.set(0.18, 3.55, 0.42);
  heart.scale.set(0.78, 1.05, 0.65);
  heart.name = 'hologram-heart';
  heart.userData.organ = 'heart';
  parent.add(heart);

  // Lungs (left and right)
  [-1, 1].forEach((side) => {
    const lungGeo = new THREE.SphereGeometry(0.34, 12, 12);
    const lungMaterial = createOrganMaterial('#3bdcf4', '#ffa500');
    const lung = new THREE.Mesh(lungGeo, lungMaterial);
    lung.position.set(side * 0.34, 3.8, 0.36);
    lung.scale.set(0.68, 1.12, 0.55);
    lung.name = `hologram-lung-${side > 0 ? 'right' : 'left'}`;
    lung.userData.organ = 'lungs';
    parent.add(lung);
  });

  // Brain
  const brainGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const brainMaterial = createOrganMaterial('#72e5d0', '#ff3b30');
  const brain = new THREE.Mesh(brainGeo, brainMaterial);
  brain.position.set(0, 5.2, 0);
  brain.scale.set(1.1, 1.15, 1.1);
  brain.name = 'hologram-brain';
  brain.userData.organ = 'brain';
  parent.add(brain);

  // Core / abdomen
  const coreGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 12, 18, true);
  const coreMaterial = createOrganMaterial('#3d8bff', '#ffa500');
  const core = new THREE.Mesh(coreGeo, coreMaterial);
  core.position.set(0, 2.8, 0.4);
  core.scale.set(1, 1, 1);
  core.name = 'hologram-core';
  core.userData.organ = 'core';
  parent.add(core);

  // Spine
  const spineGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.7, 6, 18);
  const spineMaterial = new THREE.MeshBasicMaterial({ color: '#8bf6ff', transparent: true, opacity: 0.6, depthWrite: false });
  const spine = new THREE.Mesh(spineGeo, spineMaterial);
  spine.position.set(0, 3.55, 0.18);
  parent.add(spine);

  // Heart wireframe accent
  const heartWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.23, 2),
    new THREE.MeshBasicMaterial({ color: '#4deaff', wireframe: true, transparent: true, opacity: 0.5, depthWrite: false })
  );
  heartWire.position.copy(heart.position);
  heartWire.scale.copy(heart.scale);
  parent.add(heartWire);

  // Lung wireframe accents
  [-1, 1].forEach((side) => {
    const lungWire = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 12),
      new THREE.MeshBasicMaterial({ color: '#4deaff', wireframe: true, transparent: true, opacity: 0.5, depthWrite: false })
    );
    lungWire.position.set(side * 0.34, 3.8, 0.36);
    lungWire.scale.set(0.68 * 1.02, 1.12 * 0.98, 0.55 * 1.01);
    parent.add(lungWire);
  });
}

// ============================================
// HOLOGRAPHIC POINT SHELL
// --------------------------------------------
// Nube de puntos muestreada sobre la silueta humana. Aporta la
// "red de puntos" translúcida que el wireframe solo no consigue,
// con blending aditivo para que brille con el bloom.
// ============================================

function createBodyPointCloud(pointCount = 4200): THREE.Points {
  const shape = createHumanSilhouetteShape();
  const samplingGeo = new THREE.ShapeGeometry(shape, 32);
  samplingGeo.center();
  samplingGeo.translate(0, 2.82, 0);

  const position = samplingGeo.attributes.position as THREE.BufferAttribute;
  const index = samplingGeo.index;
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  const tint = new THREE.Color();

  for (let i = 0; i < pointCount; i += 1) {
    let ax = 0;
    let ay = 0;
    let bx = 0;
    let by = 0;
    let cx = 0;
    let cy = 0;

    if (index && index.count >= 3) {
      const tri = Math.floor(Math.random() * (index.count / 3));
      const ia = index.getX(tri * 3);
      const ib = index.getX(tri * 3 + 1);
      const ic = index.getX(tri * 3 + 2);
      ax = position.getX(ia); ay = position.getY(ia);
      bx = position.getX(ib); by = position.getY(ib);
      cx = position.getX(ic); cy = position.getY(ic);
    }

    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    positions[i * 3] = ax + (bx - ax) * u + (cx - ax) * v;
    positions[i * 3 + 1] = ay + (by - ay) * u + (cy - ay) * v;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.15;

    tint.setRGB(0.16, 0.85, 1).multiplyScalar(0.45 + Math.random() * 0.55);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  samplingGeo.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'body-particle-shell';
  return points;
}

// ============================================
// FLOATING HUD PANELS (canvas textures)
// --------------------------------------------
// Planos translúcidos a ambos lados del proyector con ECG,
// barras, medidor radial, ADN y símbolos médicos. Se dibujan
// en un canvas 2D y se animan a ~12 fps para no penalizar GPU.
// ============================================

interface HudPanelController {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHudCorners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, len: number) {
  const corners: Array<[number, number, number, number]> = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.9)';
  ctx.lineWidth = 3;
  corners.forEach(([cx, cy, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * len, cy);
    ctx.stroke();
  });
}

function ecgWave(phase: number): number {
  const gaussian = (center: number, width: number, amp: number) =>
    amp * Math.exp(-((phase - center) * (phase - center)) / (2 * width * width));
  return (
    gaussian(0.16, 0.018, 0.18) +
    gaussian(0.28, 0.012, -0.16) +
    gaussian(0.33, 0.006, 1) +
    gaussian(0.37, 0.014, -0.34) +
    gaussian(0.5, 0.04, 0.24) +
    gaussian(0.75, 0.06, 0.12)
  );
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  color: string,
) {
  const n = 18;
  const gap = 4;
  const bw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    const v = 0.2 + 0.8 * Math.abs(Math.sin(time * 1.6 + i * 0.55) * Math.cos(i * 0.3));
    const bh = Math.max(4, v * h);
    const bx = x + i * (bw + gap);
    const grad = ctx.createLinearGradient(0, y + h - bh, 0, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(34, 211, 238, 0.12)');
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillRect(bx, y + h - bh, bw, bh);
  }
  ctx.shadowBlur = 0;
}

function drawGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  value: number,
  time: number,
) {
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  const clamped = Math.max(0.02, Math.min(1, value));

  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.16)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.stroke();

  ctx.strokeStyle = clamped > 0.75 ? '#fbbf24' : '#22d3ee';
  ctx.shadowColor = clamped > 0.75 ? '#fbbf24' : '#22d3ee';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + (end - start) * clamped);
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let i = 0; i <= 10; i += 1) {
    const angle = start + (end - start) * (i / 10);
    const inner = r + 12;
    const outer = r + (i % 5 === 0 ? 22 : 17);
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.45)';
    ctx.lineWidth = i % 5 === 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  const pulse = 0.65 + Math.sin(time * 3) * 0.15;
  ctx.font = '700 38px ui-monospace, monospace';
  ctx.fillStyle = '#a5f3fc';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(clamped * 100)}%`, cx, cy + 12);
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = `rgba(103, 232, 249, ${pulse})`;
  ctx.fillText('RIESGO', cx, cy + 38);
  ctx.textAlign = 'left';
}

function drawDna(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
  const height = 130;
  const width = 42;
  const turns = 2.1;

  for (let strand = 0; strand < 2; strand += 1) {
    const strandColor = strand === 0 ? '#22d3ee' : '#a78bfa';
    ctx.strokeStyle = strandColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = strandColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let step = 0; step <= 1; step += 0.01) {
      const angle = step * Math.PI * 2 * turns + time * 1.2 + strand * Math.PI;
      const x = cx + Math.sin(angle) * width;
      const y = cy + height / 2 - step * height;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 14; i += 1) {
    const step = i / 14;
    const angle = step * Math.PI * 2 * turns + time * 1.2;
    const x1 = cx + Math.sin(angle) * width;
    const x2 = cx + Math.sin(angle + Math.PI) * width;
    const y = cy + height / 2 - step * height;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(165, 243, 252, 0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('ADN · SECUENCIA', cx, cy + height / 2 + 28);
  ctx.textAlign = 'left';
}

function drawHudPanel(ctx: CanvasRenderingContext2D, kind: 'left' | 'right', time: number) {
  const W = 640;
  const H = 420;
  ctx.clearRect(0, 0, W, H);
  ctx.save();

  const background = ctx.createLinearGradient(0, 0, 0, H);
  background.addColorStop(0, 'rgba(8, 47, 73, 0.5)');
  background.addColorStop(1, 'rgba(2, 12, 24, 0.28)');
  ctx.fillStyle = background;
  roundRect(ctx, 8, 8, W - 16, H - 16, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 224, 255, 0.72)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawHudCorners(ctx, 8, 8, W - 16, H - 16, 30);

  ctx.font = '600 20px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(165, 243, 252, 0.95)';
  ctx.fillText(kind === 'left' ? 'ECG · TELEMETRÍA' : 'BIOMETRÍA · GENÓMICA', 30, 48);
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(103, 232, 249, 0.6)';
  ctx.fillText(`LINK 0${kind === 'left' ? 1 : 2} / LIVE`, 30, 70);
  ctx.beginPath();
  ctx.fillStyle = `rgba(52, 211, 153, ${0.45 + Math.sin(time * 3) * 0.45})`;
  ctx.arc(W - 34, 42, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 84);
  ctx.lineTo(W - 28, 84);
  ctx.stroke();

  if (kind === 'left') {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 32; x < W - 28; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 250);
      ctx.stroke();
    }
    for (let y = 100; y <= 250; y += 25) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(W - 28, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#5ff5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let x = 28; x <= W - 28; x += 1) {
      const phase = (((x - 28) / (W - 56)) * 5 + time * 1.4) % 1;
      const y = 175 - ecgWave(phase) * 70;
      if (x === 28) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const bpm = 70 + Math.round(Math.sin(time * 0.7) * 3);
    ctx.font = '700 46px ui-monospace, monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText(String(bpm), 34, 330);
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(165, 243, 252, 0.7)';
    ctx.fillText('BPM', 128, 330);

    drawBars(ctx, 240, 292, 360, 48, time, '#22d3ee');
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(103, 232, 249, 0.6)';
    ctx.fillText('FLUJO · SpO2 · TEMP · HRV', 240, 372);
  } else {
    drawGauge(ctx, 145, 180, 70, 0.62 + Math.sin(time * 0.6) * 0.05, time);
    drawDna(ctx, 420, 150, time);

    const stats: Array<[string, string, string]> = [
      ['OXÍGENO', '98%', 'rgba(52, 211, 153, 0.9)'],
      ['RITMO', 'NOMINAL', 'rgba(52, 211, 153, 0.9)'],
      ['ALERTAS', '0', 'rgba(251, 191, 36, 0.9)'],
    ];
    stats.forEach(([label, value, dot], i) => {
      const y = 300 + i * 30;
      ctx.beginPath();
      ctx.fillStyle = dot;
      ctx.arc(292, y - 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(103, 232, 249, 0.62)';
      ctx.fillText(label, 306, y);
      ctx.font = '600 16px ui-monospace, monospace';
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText(value, 452, y);
    });
  }

  ctx.restore();
}

function createHudPanels(): HudPanelController {
  const group = new THREE.Group();
  group.name = 'hud-panels';

  interface PanelEntry {
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    kind: 'left' | 'right';
    nextDraw: number;
    mesh: THREE.Mesh;
  }

  const panels: PanelEntry[] = [];
  const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = [];

  const makePanel = (kind: 'left' | 'right', x: number, rotationY: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(2.85, 1.87);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 3.1, 0.15);
    mesh.rotation.y = rotationY;
    mesh.name = `hud-panel-${kind}`;

    group.add(mesh);
    panels.push({ ctx, texture, kind, nextDraw: -1, mesh });
    disposables.push(geometry, material, texture);
  };

  makePanel('left', -3.55, 0.34);
  makePanel('right', 3.55, -0.34);

  return {
    group,
    update(elapsed: number) {
      panels.forEach((panel) => {
        if (elapsed < panel.nextDraw) return;
        panel.nextDraw = elapsed + 1 / 12;
        drawHudPanel(panel.ctx, panel.kind, elapsed);
        panel.texture.needsUpdate = true;
      });
      group.children.forEach((child, index) => {
        child.position.y = 3.1 + Math.sin(elapsed * 0.8 + index * 1.7) * 0.07;
        child.rotation.z = Math.sin(elapsed * 0.5 + index) * 0.01;
      });
    },
    dispose() {
      disposables.forEach((item) => item.dispose());
      panels.length = 0;
      group.clear();
    },
  };
}

// ============================================
// VOLUMETRIC LIGHT + FLOATING PARTICLES
// --------------------------------------------
// Un cono de luz aditivo sobre el proyector, un halo radial de
// fondo y partículas con caída suave (bokeh) distribuidas en Z
// para dar sensación de profundidad de campo.
// ============================================

interface VolumetricController {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
}

function createVolumetricBeam(): VolumetricController {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#22d3ee') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float base = smoothstep(0.0, 0.2, vUv.y);
        float top = smoothstep(1.0, 0.3, vUv.y);
        float envelope = base * top;
        float bands = 0.55 + 0.45 * sin(vUv.y * 34.0 - uTime * 2.4);
        float edge = smoothstep(0.0, 0.22, min(vUv.x, 1.0 - vUv.x));
        float alpha = envelope * (0.32 + bands * 0.18) * edge * 0.07;
        gl_FragColor = vec4(uColor * (0.8 + bands * 0.2), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.CylinderGeometry(2.45, 0.45, 6.4, 48, 1, true);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 3.25;
  mesh.name = 'volumetric-beam';
  return { mesh, material };
}

function createBackdropGlow(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.32)');
    gradient.addColorStop(0.45, 'rgba(14, 116, 144, 0.12)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(9, 9, 1);
  sprite.position.set(0, 3.1, -5);
  sprite.renderOrder = -1;
  sprite.name = 'backdrop-glow';
  return sprite;
}

interface ParticleController {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  setPixelRatio: (ratio: number) => void;
}

function createFloatingParticles(count = 140): ParticleController {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 11;
    positions[i * 3 + 1] = Math.random() * 7.5;
    positions[i * 3 + 2] = -1 - Math.random() * 6.5;
    sizes[i] = 0.8 + Math.random() * 2.4;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.32 + aPhase) * 0.45;
        p.x += cos(uTime * 0.21 + aPhase) * 0.22;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uPixelRatio * (110.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.14 + 0.24 * (0.5 + 0.5 * sin(uTime * 0.8 + aPhase));
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float core = smoothstep(0.5, 0.0, d);
        float halo = smoothstep(0.5, 0.18, d) * 0.24;
        gl_FragColor = vec4(vec3(0.35, 0.95, 1.0), (core * core + halo) * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'floating-particles';

  return {
    points,
    material,
    setPixelRatio: (ratio: number) => {
      material.uniforms.uPixelRatio.value = ratio;
    },
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HologramScene({ zones, onSelectZone }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const scanlineMeshRef = useRef<THREE.Mesh | null>(null);
  const targetRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  const dragRef = useRef({ x: 0, y: 0, moved: false, active: false });
  const rotationTargetRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const lastInteractionRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [renderError, setRenderError] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelFallback, setModelFallback] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [holoColor, setHoloColor] = useState('#00f3ff');
  const [scanSpeed, setScanSpeed] = useState(2.2);
  const [glitch, setGlitch] = useState(0.35);
  const [opacity, setOpacity] = useState(0.7);
  const [glow, setGlow] = useState(0.6);
  const organHighlightMap = useRef<Map<string, number>>(new Map()); // organ name -> emissive intensity
  const organMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const holoUniformsRef = useRef<HologramUniforms | null>(null);
  const projectorMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const aberrationPassRef = useRef<ShaderPass | null>(null);
  const hudRef = useRef<HudPanelController | null>(null);
  const beamMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const particlesRef = useRef<ParticleController | null>(null);
  const boneAnchorsRef = useRef<
    Array<{ id: string; bone: THREE.Object3D; marker: THREE.Object3D; ring: THREE.Object3D }>
  >([]);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    const supportsWebGL2 = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return false;
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return true;
      } catch {
        return false;
      }
    })();

    if (!supportsWebGL2) {
      setRenderError(true);
      setModelLoading(false);
      return;
    }

    // ----- Renderer -----
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      console.error('No se pudo crear el contexto WebGL del holograma', error);
      setRenderError(true);
      setModelLoading(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x02060d, 1); // Deep space background
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', 'Modelo holográfico 3D interactivo del cuerpo humano');
    renderer.domElement.className = 'hologram-canvas';
    host.prepend(renderer.domElement);

    rendererRef.current = renderer;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setRenderError(true);
      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // ----- Scene -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02060d);

    // ----- Lights (sutiles, el shader holográfico es unlit) -----
    scene.add(new THREE.AmbientLight(0x88ccff, 0.5));
    const keyLight = new THREE.PointLight(0x00f3ff, 12, 30, 1.6);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x0088ff, 8, 30, 1.6);
    rimLight.position.set(-5, 4, -6);
    scene.add(rimLight);

    // ----- Camera -----
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(9, 5, 14);
    camera.lookAt(0, 2.75, 0);
    cameraRef.current = camera;

    // ----- Postprocessing: bloom / glow holográfico -----
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    composer.setSize(host.clientWidth, host.clientHeight);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(host.clientWidth, host.clientHeight),
      0.6,
      0.45,
      0.55,
    );
    composer.addPass(bloomPass);
    // Aberración cromática sutil (coste mínimo, look cinematográfico)
    const aberrationPass = new ShaderPass(RGBShiftShader);
    aberrationPass.uniforms.amount.value = 0.0006;
    composer.addPass(aberrationPass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;
    aberrationPassRef.current = aberrationPass;

    // ----- Orbit Controls (solo damping; rotación/zoom los maneja la escena) -----
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 3;
    controls.minAzimuthAngle = -0.8;
    controls.maxAzimuthAngle = 0.8;

    // ----- Scanline overlay mesh -----
    const scanlineGeometry = new THREE.PlaneGeometry(2, 2);
    const scanlineMaterial = createScanlineMaterial();
    const scanlineMesh = new THREE.Mesh(scanlineGeometry, scanlineMaterial);
    scanlineMesh.position.z = -1;
    scanlineMesh.renderOrder = 10; // Render on top
    scene.add(scanlineMesh);
    scanlineMeshRef.current = scanlineMesh;

    // ----- Create anatomical model (Xbot GLB, silhouette fallback) -----
    const model = new THREE.Group();
    modelRef.current = model;
    scene.add(model);

    // ----- Floating HUD panels (ECG, barras, ADN, medidor) -----
    const hud = createHudPanels();
    scene.add(hud.group);
    hudRef.current = hud;

    // ----- Iluminación volumétrica y partículas con profundidad -----
    const volumetric = createVolumetricBeam();
    scene.add(volumetric.mesh);
    beamMaterialRef.current = volumetric.material;

    const backdropGlow = createBackdropGlow();
    scene.add(backdropGlow);

    const particles = createFloatingParticles(140);
    scene.add(particles.points);
    particlesRef.current = particles;

    const organAlertsMap = new Map<string, boolean>();
    zones.forEach((zone) => {
      if (zone.id === 'heart' || zone.id === 'lungs' || zone.id === 'brain' || zone.id === 'core') {
        organAlertsMap.set(zone.id, zone.active);
      }
    });

    const holoUniforms = createHologramUniforms();
    holoUniformsRef.current = holoUniforms;
    const holoMaterial = createHologramMaterial(holoUniforms);

    const findBone = (root: THREE.Object3D, patterns: RegExp[]) => {
      let found: THREE.Object3D | null = null;
      root.traverse((obj) => {
        if (found) return;
        if (patterns.some((p) => p.test(obj.name))) found = obj;
      });
      return found;
    };

    const registerOrganMeshes = (root: THREE.Object3D) => {
      const map = new Map<string, THREE.Mesh[]>();
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        const organ = mesh.userData.organ as string | undefined;
        if (mesh.isMesh && organ) {
          const list = map.get(organ);
          if (list) list.push(mesh);
          else map.set(organ, [mesh]);
        }
      });
      organMeshesRef.current = map;
    };

    const loadFallbackBody = () => {
      setModelFallback(true);
      setModelLoading(false);
      createBody(model, organAlertsMap);
      registerOrganMeshes(model);
    };

    const loader = new GLTFLoader();
    loader.load(
      '/models/Xbot.glb',
      (gltf) => {
        if (cancelled) return;
        const xbot = gltf.scene;

        // Normalizar escala: altura objetivo ~5.4 unidades, pies en y=0
        const bbox = new THREE.Box3().setFromObject(xbot);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const targetHeight = 5.4;
        const scale = targetHeight / (size.y || 1);
        xbot.scale.setScalar(scale);
        const bbox2 = new THREE.Box3().setFromObject(xbot);
        xbot.position.y -= bbox2.min.y;
        xbot.position.z = 0;

        // Aplicar shader holográfico a todos los meshes de piel
        const skinMeshes: THREE.Mesh[] = [];
        xbot.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = holoMaterial;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.frustumCulled = false;
            skinMeshes.push(mesh);
          }
        });

        // Wireframe adicional: densifica la lectura como "red de líneas"
        const wireMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#2ee8ff'),
          wireframe: true,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        skinMeshes.forEach((mesh) => {
          const parent = mesh.parent;
          if (!parent) return;
          const wire = mesh.clone(false) as THREE.Mesh;
          wire.material = wireMaterial;
          wire.name = `${mesh.name || 'xbot'}-wire`;
          wire.renderOrder = 1;
          wire.scale.multiplyScalar(1.002);
          parent.add(wire);
        });

        model.add(xbot);

        // Anclar zonas a huesos para que sigan la animación idle
        const anchors: Array<{ id: string; bone: THREE.Object3D | null }> = [
          { id: 'brain', bone: findBone(xbot, [/head/i]) },
          { id: 'heart', bone: findBone(xbot, [/spine2/i, /spine_2/i]) ?? findBone(xbot, [/spine1/i]) },
          { id: 'lungs', bone: findBone(xbot, [/spine1/i, /spine_1/i]) ?? findBone(xbot, [/spine/i]) },
          { id: 'core', bone: findBone(xbot, [/spine(?!.*[12])/i]) ?? findBone(xbot, [/spine/i]) },
          { id: 'bones', bone: findBone(xbot, [/hips/i, /pelvis/i]) },
        ];
        boneAnchorsRef.current = anchors
          .filter((a): a is { id: string; bone: THREE.Object3D } => !!a.bone)
          .map((a) => {
            const marker = model.getObjectByName(`zone-${a.id}`);
            const ring = model.getObjectByName(`zone-ring-${a.id}`);
            if (!marker || !ring) return null;
            return { id: a.id, bone: a.bone, marker, ring };
          })
          .filter(
            (a): a is { id: string; bone: THREE.Object3D; marker: THREE.Object3D; ring: THREE.Object3D } =>
              a !== null,
          );

        // Animación idle en bucle
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(xbot);
          const clip = gltf.animations.find((c) => /idle/i.test(c.name)) ?? gltf.animations[0];
          mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
          mixerRef.current = mixer;
        }

        setModelLoading(false);
      },
      undefined,
      () => { if (!cancelled) loadFallbackBody(); },
    );

    // ----- Projector disc (base brillante bajo los pies) -----
    const projectorMat = createProjectorMaterial();
    projectorMatRef.current = projectorMat;
    const projector = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), projectorMat);
    projector.rotation.x = -Math.PI / 2;
    projector.position.y = 0.05;
    projector.name = 'projector-disc';
    scene.add(projector);

    // ----- Grid -----
    const grid = new THREE.GridHelper(8, 32, 0x12677a, 0x0b2d42);
    grid.position.y = 0.02;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.38;
    });
    scene.add(grid);

    // ----- Projection rings -----
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

    // ----- Zone markers & rings -----
    Object.entries(ZONE_POSITIONS).forEach(([id, position]) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshBasicMaterial({ color: '#55eaff', transparent: true, opacity: 0.1, depthWrite: false }),
      );
      marker.position.copy(position);
      marker.userData.zoneId = id;
      marker.name = `zone-${id}`;
      model.add(marker);
      targetRef.current.push(marker);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(id === 'lungs' ? 0.36 : 0.28, 0.02, 8, 64),
        new THREE.MeshBasicMaterial({ color: '#48e9ff', transparent: true, opacity: 0.7 }),
      );
      ring.position.copy(position);
      ring.name = `zone-ring-${id}`;
      if (id === 'env') ring.rotation.y = Math.PI / 2;
      else ring.rotation.x = Math.PI / 2;
      model.add(ring);
    });
    // Fix targetRef after push
    targetRef.current = [...targetRef.current] as THREE.Mesh[];

    // ----- Raycaster -----
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // ----- Wheel zoom -----
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.multiplyScalar(event.deltaY > 0 ? 1.08 : 0.92);
      camera.position.clampLength(6.5, 25);
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // ----- Resize observer -----
    const resizeObserver = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      composer.setSize(host.clientWidth, host.clientHeight);
      particlesRef.current?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    });
    resizeObserver.observe(host);

    // ----- Animation loop -----
    const clock = clockRef.current;
    const worldPosition = new THREE.Vector3();
    const localPosition = new THREE.Vector3();
    clock.start();
    renderer.setAnimationLoop((renderTime) => {
      const elapsed = renderTime / 1000;
      const delta = Math.min(clock.getDelta(), 0.1);
      const smoothing = 1 - Math.exp(-delta * 8);

      // Rotación con inercia: deriva idle + parallax de cursor sin pelear con el drag
      if (elapsed - lastInteractionRef.current > 4) {
        rotationTargetRef.current.y += delta * 0.08;
      }
      const parallaxX = dragRef.current.active ? 0 : pointerRef.current.x;
      const parallaxY = dragRef.current.active ? 0 : pointerRef.current.y;
      const targetRotationX = rotationTargetRef.current.x + parallaxY * 0.05;
      const targetRotationY = rotationTargetRef.current.y + parallaxX * 0.08;
      model.rotation.x += (targetRotationX - model.rotation.x) * smoothing;
      model.rotation.y += (targetRotationY - model.rotation.y) * smoothing;

      // Advance skeletal animation (idle)
      if (mixerRef.current) mixerRef.current.update(delta);

      // Update hologram + projector shader uniforms
      if (holoUniformsRef.current) holoUniformsRef.current.uTime.value = elapsed;
      if (projectorMatRef.current) {
        (projectorMatRef.current.uniforms.uTime as { value: number }).value = elapsed;
      }
      if (beamMaterialRef.current) {
        (beamMaterialRef.current.uniforms.uTime as { value: number }).value = elapsed;
      }
      if (particlesRef.current) {
        (particlesRef.current.material.uniforms.uTime as { value: number }).value = elapsed;
      }

      // Attach zone markers to animated bones (world -> model local)
      if (boneAnchorsRef.current.length > 0) {
        boneAnchorsRef.current.forEach(({ bone, marker, ring }) => {
          bone.getWorldPosition(worldPosition);
          worldPosition.z += 0.35;
          localPosition.copy(worldPosition);
          model.worldToLocal(localPosition);
          marker.position.copy(localPosition);
          ring.position.copy(localPosition);
        });
      }

      // Pulse organ highlights based on alert state (sin traverse por frame)
      const pulse = 0.3 + Math.sin(elapsed * 2) * 0.2;
      organHighlightMap.current.forEach((intensity, organName) => {
        const meshes = organMeshesRef.current.get(organName);
        if (!meshes) return;
        meshes.forEach((mesh) => {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material) material.emissiveIntensity = intensity * pulse;
        });
      });

      // Update scanline time uniform
      if (scanlineMeshRef.current && scanlineMeshRef.current.material) {
        const scanlineMaterial = scanlineMeshRef.current.material as THREE.ShaderMaterial;
        scanlineMaterial.uniforms.time.value = elapsed * 0.3;
      }

      // Update floating HUD panels (ECG, bars, DNA, gauge)
      if (hudRef.current) hudRef.current.update(elapsed);

      // Update controls
      controls.update();

      // Render con postprocesamiento (bloom + aberración cromática)
      try {
        composer.render();
      } catch (error) {
        console.error('Error al renderizar el holograma', error);
        setRenderError(true);
        renderer.setAnimationLoop(null);
      }
    });

    // ----- Return cleanup -----
    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      if (hudRef.current) {
        hudRef.current.dispose();
        hudRef.current = null;
      }
      volumetric.mesh.geometry.dispose();
      volumetric.material.dispose();
      backdropGlow.material.map?.dispose();
      backdropGlow.material.dispose();
      particles.points.geometry.dispose();
      particles.material.dispose();
      beamMaterialRef.current = null;
      particlesRef.current = null;
      aberrationPassRef.current = null;
      composer.dispose();
      composerRef.current = null;
      bloomPassRef.current = null;
      renderer.dispose();
      holoUniformsRef.current = null;
      projectorMatRef.current = null;
      mixerRef.current = null;
      boneAnchorsRef.current = [];
      renderer.domElement.remove();
      modelRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      targetRef.current = [];
      raycasterRef.current = null;
    };
  }, []);

  // ----- Zone highlighting effect -----
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

      // Also update organ highlight map
      if (zone.id === 'heart' || zone.id === 'lungs' || zone.id === 'brain' || zone.id === 'core') {
        organHighlightMap.current.set(zone.id, zone.active ? 1.0 : 0.3);
      }
    });
  }, [zones]);

  // ----- Panel control -> shader uniforms (tiempo real) -----
  useEffect(() => {
    const u = holoUniformsRef.current;
    if (!u) return;
    u.uColor.value.set(holoColor);
    u.uScanSpeed.value = scanSpeed;
    u.uGlitchIntensity.value = glitch;
    u.uOpacity.value = opacity;
    if (projectorMatRef.current) {
      (projectorMatRef.current.uniforms.uColor as { value: THREE.Color }).value.set(holoColor);
    }
  }, [holoColor, scanSpeed, glitch, opacity, modelLoading]);

  // ----- Bloom strength -> postprocessing pass -----
  useEffect(() => {
    if (bloomPassRef.current) bloomPassRef.current.strength = glow;
  }, [glow]);

  const resetHoloDefaults = () => {
    setHoloColor('#00f3ff');
    setScanSpeed(2.2);
    setGlitch(0.35);
    setOpacity(0.85);
    setGlow(0.9);
  };

  // ----- Interaction handlers -----
  const rotateBy = (amount: number) => {
    rotationTargetRef.current.y += amount;
    lastInteractionRef.current = performance.now() / 1000;
    setRotation(Math.round(THREE.MathUtils.radToDeg(rotationTargetRef.current.y)));
  };

  const resetView = () => {
    const model = modelRef.current;
    const camera = cameraRef.current;
    if (!model || !camera) return;
    rotationTargetRef.current = { x: 0, y: 0 };
    pointerRef.current = { x: 0, y: 0 };
    model.rotation.set(0, 0, 0);
    camera.position.set(9, 5, 14);
    camera.lookAt(0, 2.75, 0);
    lastInteractionRef.current = performance.now() / 1000;
    setRotation(0);
  };

  const zoom = (factor: number) => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.multiplyScalar(factor);
    camera.position.clampLength(6.5, 25);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    dragRef.current = { x: event.clientX, y: event.clientY, moved: false, active: true };
    lastInteractionRef.current = performance.now() / 1000;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    };
    lastInteractionRef.current = performance.now() / 1000;

    if (event.buttons !== 1) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) dragRef.current.moved = true;
    rotationTargetRef.current.y += deltaX * 0.006;
    rotationTargetRef.current.x = THREE.MathUtils.clamp(
      rotationTargetRef.current.x + deltaY * 0.003,
      -0.3,
      0.3,
    );
    setRotation(Math.round(THREE.MathUtils.radToDeg(rotationTargetRef.current.y)));
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
    dragRef.current.active = false;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    dragRef.current.active = false;
    lastInteractionRef.current = performance.now() / 1000;
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
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerUp}
      >
        {renderError && (
          <div className="hologram-fallback" role="status">
            <span>El navegador no pudo iniciar el renderizado 3D.</span>
            <span>Prueba con aceleración gráfica habilitada.</span>
            <button type="button" className="hologram-fallback-action" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )}
        {modelLoading && !renderError && (
          <div className="hologram-fallback" role="status">
            <span>CARGANDO HOLOGRAMA…</span>
            <span>Descargando modelo Xbot.glb</span>
          </div>
        )}
        {modelFallback && !modelLoading && (
          <div className="hologram-fallback-note" role="status">Modelo GLB no disponible · silueta de respaldo</div>
        )}
        <div className={`hologram-panel ${panelOpen ? 'is-open' : ''}`} aria-label="Panel de control del holograma">
          <button type="button" className="hologram-panel-toggle" onClick={() => setPanelOpen((v) => !v)} aria-label={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}>
            {panelOpen ? '✕' : '⚙'} <span>HOLO-CTRL</span>
          </button>
          {panelOpen && (
            <div className="hologram-panel-body">
              <label>
                <span>Color</span>
                <input type="color" value={holoColor} onChange={(e) => setHoloColor(e.target.value)} />
              </label>
              <label>
                <span>Velocidad scanlines · {scanSpeed.toFixed(1)}</span>
                <input type="range" min={0} max={6} step={0.1} value={scanSpeed} onChange={(e) => setScanSpeed(Number(e.target.value))} />
              </label>
              <label>
                <span>Intensidad glitch · {glitch.toFixed(2)}</span>
                <input type="range" min={0} max={1.5} step={0.01} value={glitch} onChange={(e) => setGlitch(Number(e.target.value))} />
              </label>
              <label>
                <span>Opacidad · {opacity.toFixed(2)}</span>
                <input type="range" min={0.3} max={1} step={0.01} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
              </label>
              <label>
                <span>Glow / bloom · {glow.toFixed(2)}</span>
                <input type="range" min={0} max={2} step={0.05} value={glow} onChange={(e) => setGlow(Number(e.target.value))} />
              </label>
              <button type="button" className="hologram-panel-reset" onClick={resetHoloDefaults}>Restablecer</button>
            </div>
          )}
        </div>
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