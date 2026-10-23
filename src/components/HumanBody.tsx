import { useState, useMemo } from 'react';
import type { AnomalyResult, SafetyAlert, SensorReading } from '../engine/types';

interface Props {
  reading: SensorReading | undefined;
  anomalies: AnomalyResult[];
  alerts: SafetyAlert[];
}

interface BodyZone {
  id: string;
  name: string;
  cx: number;
  cy: number;
  radius: number;
  relatedParams: string[];
  relatedAreas: string[];
}

const BODY_ZONES: BodyZone[] = [
  { id: 'brain', name: 'Cerebro', cx: 200, cy: 75, radius: 35, relatedParams: ['stressIndex', 'sleepQuality'], relatedAreas: ['psychological'] },
  { id: 'heart', name: 'Corazón', cx: 215, cy: 235, radius: 30, relatedParams: ['heartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP'], relatedAreas: ['cardiovascular'] },
  { id: 'lungs', name: 'Pulmones', cx: 200, cy: 260, radius: 45, relatedParams: ['spo2'], relatedAreas: ['immune'] },
  { id: 'core', name: 'Núcleo / Temp.', cx: 200, cy: 330, radius: 35, relatedParams: ['temperature', 'skinTemperature'], relatedAreas: ['immune'] },
  { id: 'bones', name: 'Sistema Óseo', cx: 200, cy: 480, radius: 40, relatedParams: [], relatedAreas: ['bone'] },
  { id: 'env', name: 'Entorno', cx: 340, cy: 300, radius: 30, relatedParams: ['co2Level', 'ambientTemp', 'noiseLevel', 'radiationDose'], relatedAreas: ['environmental'] },
];

// Wireframe mesh points for the human body
const generateWireframeMesh = () => {
  const points: { x: number; y: number; group: string }[] = [];
  const lines: { x1: number; y1: number; x2: number; y2: number; group: string }[] = [];

  // Head (sphere wireframe)
  const headCx = 200, headCy = 75, headR = 32;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    points.push({ x: headCx + Math.cos(angle) * headR, y: headCy + Math.sin(angle) * headR * 0.9, group: 'head' });
    // Connect to next
    const nextAngle = ((i + 1) / 12) * Math.PI * 2;
    lines.push({
      x1: headCx + Math.cos(angle) * headR,
      y1: headCy + Math.sin(angle) * headR * 0.9,
      x2: headCx + Math.cos(nextAngle) * headR,
      y2: headCy + Math.sin(nextAngle) * headR * 0.9,
      group: 'head'
    });
  }
  // Head cross lines
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI;
    lines.push({
      x1: headCx + Math.cos(angle) * headR,
      y1: headCy + Math.sin(angle) * headR * 0.9,
      x2: headCx - Math.cos(angle) * headR,
      y2: headCy - Math.sin(angle) * headR * 0.9,
      group: 'head'
    });
  }
  // Neck
  points.push({ x: 195, y: 108, group: 'neck' });
  points.push({ x: 205, y: 108, group: 'neck' });
  lines.push({ x1: 195, y1: 108, x2: 205, y2: 108, group: 'neck' });
  lines.push({ x1: 195, y1: 108, x2: 190, y2: 125, group: 'neck' });
  lines.push({ x1: 205, y1: 108, x2: 210, y2: 125, group: 'neck' });

  // Shoulders
  const shoulderY = 135;
  points.push({ x: 130, y: shoulderY, group: 'torso' });
  points.push({ x: 270, y: shoulderY, group: 'torso' });
  points.push({ x: 200, y: shoulderY - 10, group: 'torso' });
  lines.push({ x1: 130, y1: shoulderY, x2: 200, y2: shoulderY - 10, group: 'torso' });
  lines.push({ x1: 270, y1: shoulderY, x2: 200, y2: shoulderY - 10, group: 'torso' });
  lines.push({ x1: 130, y1: shoulderY, x2: 270, y2: shoulderY, group: 'torso' });

  // Torso wireframe (triangulated mesh)
  const torsoPoints = [
    // Chest level
    { x: 145, y: 160 }, { x: 175, y: 155 }, { x: 200, y: 150 }, { x: 225, y: 155 }, { x: 255, y: 160 },
    // Mid torso
    { x: 150, y: 200 }, { x: 175, y: 195 }, { x: 200, y: 190 }, { x: 225, y: 195 }, { x: 250, y: 200 },
    // Lower torso
    { x: 155, y: 240 }, { x: 175, y: 235 }, { x: 200, y: 230 }, { x: 225, y: 235 }, { x: 245, y: 240 },
    // Waist
    { x: 160, y: 280 }, { x: 180, y: 275 }, { x: 200, y: 270 }, { x: 220, y: 275 }, { x: 240, y: 280 },
    // Hips
    { x: 165, y: 320 }, { x: 185, y: 315 }, { x: 200, y: 310 }, { x: 215, y: 315 }, { x: 235, y: 320 },
  ];

  torsoPoints.forEach(p => points.push({ ...p, group: 'torso' }));

  // Connect torso mesh
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const idx = row * 5 + col;
      // Horizontal
      lines.push({ x1: torsoPoints[idx].x, y1: torsoPoints[idx].y, x2: torsoPoints[idx + 1].x, y2: torsoPoints[idx + 1].y, group: 'torso' });
      // Vertical
      if (row < 4) {
        lines.push({ x1: torsoPoints[idx].x, y1: torsoPoints[idx].y, x2: torsoPoints[idx + 5].x, y2: torsoPoints[idx + 5].y, group: 'torso' });
      }
      // Diagonal
      if (row < 4) {
        lines.push({ x1: torsoPoints[idx].x, y1: torsoPoints[idx].y, x2: torsoPoints[idx + 6].x, y2: torsoPoints[idx + 6].y, group: 'torso' });
      }
    }
  }

  // Connect shoulders to chest
  lines.push({ x1: 130, y1: shoulderY, x2: 145, y2: 160, group: 'torso' });
  lines.push({ x1: 270, y1: shoulderY, x2: 255, y2: 160, group: 'torso' });

  // Arms
  const armPoints = {
    left: [
      { x: 130, y: shoulderY },
      { x: 115, y: 175 }, { x: 105, y: 220 }, { x: 95, y: 265 },
      { x: 88, y: 310 }, { x: 82, y: 355 }, { x: 78, y: 395 },
      { x: 75, y: 420 }, // hand
    ],
    right: [
      { x: 270, y: shoulderY },
      { x: 285, y: 175 }, { x: 295, y: 220 }, { x: 305, y: 265 },
      { x: 312, y: 310 }, { x: 318, y: 355 }, { x: 322, y: 395 },
      { x: 325, y: 420 }, // hand
    ],
  };

  armPoints.left.forEach((p, i) => {
    points.push({ ...p, group: 'arms' });
    if (i > 0) {
      lines.push({ x1: armPoints.left[i - 1].x, y1: armPoints.left[i - 1].y, x2: p.x, y2: p.y, group: 'arms' });
    }
  });
  armPoints.right.forEach((p, i) => {
    points.push({ ...p, group: 'arms' });
    if (i > 0) {
      lines.push({ x1: armPoints.right[i - 1].x, y1: armPoints.right[i - 1].y, x2: p.x, y2: p.y, group: 'arms' });
    }
  });

  // Legs
  const legPoints = {
    left: [
      { x: 175, y: 320 }, { x: 170, y: 370 }, { x: 168, y: 420 },
      { x: 165, y: 470 }, { x: 162, y: 520 }, { x: 160, y: 565 },
      { x: 158, y: 610 }, { x: 155, y: 640 }, // foot
    ],
    right: [
      { x: 225, y: 320 }, { x: 230, y: 370 }, { x: 232, y: 420 },
      { x: 235, y: 470 }, { x: 238, y: 520 }, { x: 240, y: 565 },
      { x: 242, y: 610 }, { x: 245, y: 640 }, // foot
    ],
  };

  legPoints.left.forEach((p, i) => {
    points.push({ ...p, group: 'legs' });
    if (i > 0) {
      lines.push({ x1: legPoints.left[i - 1].x, y1: legPoints.left[i - 1].y, x2: p.x, y2: p.y, group: 'legs' });
    }
  });
  legPoints.right.forEach((p, i) => {
    points.push({ ...p, group: 'legs' });
    if (i > 0) {
      lines.push({ x1: legPoints.right[i - 1].x, y1: legPoints.right[i - 1].y, x2: p.x, y2: p.y, group: 'legs' });
    }
  });

  // Connect hips to legs
  lines.push({ x1: 165, y1: 320, x2: 175, y2: 320, group: 'legs' });
  lines.push({ x1: 235, y1: 320, x2: 225, y2: 320, group: 'legs' });
  lines.push({ x1: 200, y1: 310, x2: 175, y2: 320, group: 'legs' });
  lines.push({ x1: 200, y1: 310, x2: 225, y2: 320, group: 'legs' });

  // Feet
  lines.push({ x1: 155, y1: 640, x2: 145, y2: 645, group: 'legs' });
  lines.push({ x1: 245, y1: 640, x2: 255, y2: 645, group: 'legs' });

  // Internal organs wireframe (subtle)
  // Heart
  const heartPoints = [
    { x: 205, y: 220 }, { x: 220, y: 225 }, { x: 225, y: 240 },
    { x: 215, y: 255 }, { x: 200, y: 250 }, { x: 195, y: 235 },
  ];
  heartPoints.forEach((p, i) => {
    points.push({ ...p, group: 'organs' });
    lines.push({
      x1: p.x, y1: p.y,
      x2: heartPoints[(i + 1) % heartPoints.length].x,
      y2: heartPoints[(i + 1) % heartPoints.length].y,
      group: 'organs'
    });
  });

  // Lungs outline
  const lungLeft = [{ x: 160, y: 200 }, { x: 155, y: 220 }, { x: 158, y: 245 }, { x: 170, y: 255 }, { x: 185, y: 245 }];
  const lungRight = [{ x: 240, y: 200 }, { x: 245, y: 220 }, { x: 242, y: 245 }, { x: 230, y: 255 }, { x: 215, y: 245 }];
  [...lungLeft, ...lungRight].forEach((p, i) => {
    points.push({ ...p, group: 'organs' });
    const arr = i < 5 ? lungLeft : lungRight;
    const localIdx = i < 5 ? i : i - 5;
    lines.push({
      x1: p.x, y1: p.y,
      x2: arr[(localIdx + 1) % arr.length].x,
      y2: arr[(localIdx + 1) % arr.length].y,
      group: 'organs'
    });
  });

  // Spine
  for (let y = 115; y <= 310; y += 20) {
    points.push({ x: 200, y, group: 'spine' });
    if (y > 115) {
      lines.push({ x1: 200, y1: y - 20, x2: 200, y2: y, group: 'spine' });
    }
  }

  return { points, lines };
};

export default function HumanBody({ reading, anomalies, alerts }: Props) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [rotateY, setRotateY] = useState(0);
  const mesh = useMemo(() => generateWireframeMesh(), []);

  if (!reading) return null;

  // Determine active zones
  const activeZones = new Map<string, { severity: string; params: string[]; areas: string[] }>();

  anomalies.forEach((anomaly) => {
    if (anomaly.severity === 'info') return;
    BODY_ZONES.forEach((zone) => {
      if (zone.relatedAreas.includes(anomaly.area)) {
        const existing = activeZones.get(zone.id);
        const severityOrder = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
        if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity as keyof typeof severityOrder]) {
          activeZones.set(zone.id, { severity: anomaly.severity, params: zone.relatedParams, areas: zone.relatedAreas });
        }
      }
    });
  });

  alerts.forEach((alert) => {
    if (alert.acknowledged) return;
    BODY_ZONES.forEach((zone) => {
      if (zone.relatedParams.includes(alert.parameter)) {
        activeZones.set(zone.id, { severity: alert.severity === 'emergency' ? 'critical' : alert.severity, params: zone.relatedParams, areas: zone.relatedAreas });
      }
    });
  });

  const getZoneColor = (zoneId: string) => {
    const active = activeZones.get(zoneId);
    if (!active) return { fill: 'transparent', stroke: '#334155', glow: false };
    switch (active.severity) {
      case 'critical': return { fill: 'rgba(239,68,68,0.2)', stroke: '#ef4444', glow: true };
      case 'high': return { fill: 'rgba(249,115,22,0.15)', stroke: '#f97316', glow: true };
      case 'medium': return { fill: 'rgba(245,158,11,0.1)', stroke: '#f59e0b', glow: true };
      case 'low': return { fill: 'rgba(234,179,8,0.08)', stroke: '#eab308', glow: false };
      default: return { fill: 'transparent', stroke: '#334155', glow: false };
    }
  };

  const getGroupColor = (group: string) => {
    // Check if any zone related to this group is active
    const zoneForGroup = BODY_ZONES.find(z => {
      if (group === 'head') return z.id === 'brain';
      if (group === 'torso') return z.id === 'heart' || z.id === 'lungs' || z.id === 'core';
      if (group === 'organs') return z.id === 'heart' || z.id === 'lungs';
      if (group === 'spine') return z.id === 'bones';
      if (group === 'legs' || group === 'arms') return z.id === 'bones';
      return false;
    });
    if (zoneForGroup && activeZones.has(zoneForGroup.id)) {
      const zone = activeZones.get(zoneForGroup.id)!;
      switch (zone.severity) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#f59e0b';
        default: return '#06b6d4';
      }
    }
    return '#1e40af';
  };

  const selectedZoneData = selectedZone ? BODY_ZONES.find(z => z.id === selectedZone) : null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="text-2xl">🫀</span>
        Cuerpo Humano Virtual — Wireframe 3D
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Body visualization */}
        <div className="relative flex items-center justify-center" style={{ perspective: '1000px' }}>
          <div
            className="relative transition-transform duration-700"
            style={{ transform: `rotateY(${rotateY}deg)` }}
          >
            <svg viewBox="0 0 400 680" className="w-full h-auto max-h-[600px]" style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.1))' }}>
              <defs>
                {/* Glow filters */}
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#ef4444" floodOpacity="0.6" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#f97316" floodOpacity="0.5" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#f59e0b" floodOpacity="0.4" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feFlood floodColor="#3b82f6" floodOpacity="0.3" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feFlood floodColor="#06b6d4" floodOpacity="0.5" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>

                {/* Grid pattern */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="400" height="680" fill="url(#grid)" opacity="0.3" />

              {/* Scan lines effect */}
              {Array.from({ length: 34 }).map((_, i) => (
                <line key={i} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#1e3a5f" strokeWidth="0.3" opacity="0.3" />
              ))}

              {/* Wireframe lines */}
              {mesh.lines.map((line, i) => {
                const color = getGroupColor(line.group);
                const isActive = activeZones.size > 0 && (
                  (line.group === 'head' && activeZones.has('brain')) ||
                  (line.group === 'organs' && (activeZones.has('heart') || activeZones.has('lungs'))) ||
                  (line.group === 'torso' && (activeZones.has('heart') || activeZones.has('lungs') || activeZones.has('core'))) ||
                  (line.group === 'spine' && activeZones.has('bones')) ||
                  (line.group === 'arms' && activeZones.has('bones')) ||
                  (line.group === 'legs' && activeZones.has('bones'))
                );
                return (
                  <line
                    key={`line-${i}`}
                    x1={line.x1} y1={line.y1}
                    x2={line.x2} y2={line.y2}
                    stroke={isActive ? color : '#1e3a5f'}
                    strokeWidth={isActive ? 1.5 : 0.8}
                    opacity={isActive ? 0.9 : 0.4}
                  />
                );
              })}

              {/* Wireframe points (nodes) */}
              {mesh.points.map((point, i) => {
                const color = getGroupColor(point.group);
                const isActive = activeZones.size > 0 && (
                  (point.group === 'head' && activeZones.has('brain')) ||
                  (point.group === 'organs' && (activeZones.has('heart') || activeZones.has('lungs'))) ||
                  (point.group === 'torso' && (activeZones.has('heart') || activeZones.has('lungs') || activeZones.has('core'))) ||
                  (point.group === 'spine' && activeZones.has('bones')) ||
                  (point.group === 'arms' && activeZones.has('bones')) ||
                  (point.group === 'legs' && activeZones.has('bones'))
                );
                return (
                  <circle
                    key={`point-${i}`}
                    cx={point.x} cy={point.y}
                    r={isActive ? 2.5 : 1.5}
                    fill={isActive ? color : '#1e40af'}
                    opacity={isActive ? 1 : 0.5}
                  />
                );
              })}

              {/* Interactive zone indicators */}
              {BODY_ZONES.map((zone) => {
                const zoneColor = getZoneColor(zone.id);
                const isActive = activeZones.has(zone.id);
                const isSelected = selectedZone === zone.id;
                const glowFilter = isActive ? (
                  zoneColor.stroke === '#ef4444' ? 'url(#glow-red)' :
                  zoneColor.stroke === '#f97316' ? 'url(#glow-orange)' :
                  zoneColor.stroke === '#f59e0b' ? 'url(#glow-amber)' :
                  'url(#glow-cyan)'
                ) : isSelected ? 'url(#glow-blue)' : undefined;

                return (
                  <g key={zone.id} onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)} className="cursor-pointer">
                    {/* Zone circle */}
                    <circle
                      cx={zone.cx} cy={zone.cy} r={zone.radius}
                      fill={zoneColor.fill}
                      stroke={zoneColor.stroke}
                      strokeWidth={isActive || isSelected ? 2 : 0.5}
                      strokeDasharray={isActive ? '4,4' : '2,4'}
                      opacity={isActive ? 0.8 : 0.3}
                      filter={glowFilter}
                      className="transition-all duration-300"
                    >
                      {isActive && (
                        <animate attributeName="r" values={`${zone.radius};${zone.radius + 5};${zone.radius}`} dur="2s" repeatCount="indefinite" />
                      )}
                    </circle>

                    {/* Pulse ring for active zones */}
                    {isActive && (
                      <circle
                        cx={zone.cx} cy={zone.cy} r={zone.radius}
                        fill="none"
                        stroke={zoneColor.stroke}
                        strokeWidth="1"
                        opacity="0.5"
                      >
                        <animate attributeName="r" values={`${zone.radius};${zone.radius + 20}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Label */}
                    <text
                      x={zone.cx} y={zone.cy + zone.radius + 14}
                      textAnchor="middle"
                      fill={isActive ? zoneColor.stroke : '#64748b'}
                      fontSize="9"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      className="pointer-events-none"
                    >
                      {zone.name}
                    </text>

                    {/* Connection line to label */}
                    <line
                      x1={zone.cx} y1={zone.cy + zone.radius}
                      x2={zone.cx} y2={zone.cy + zone.radius + 6}
                      stroke={isActive ? zoneColor.stroke : '#475569'}
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}

              {/* Heartbeat animation for heart zone */}
              {activeZones.has('heart') && (
                <g>
                  <circle cx="215" cy="235" r="5" fill="#ef4444" opacity="0.8">
                    <animate attributeName="r" values="5;12;5" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}

              {/* HUD elements */}
              <text x="10" y="20" fill="#3b82f6" fontSize="8" opacity="0.6">A.E.G.I.S. v1.0</text>
              <text x="10" y="32" fill="#3b82f6" fontSize="7" opacity="0.4">WIREFRAME MODE</text>
              <text x="320" y="20" fill="#3b82f6" fontSize="7" opacity="0.4">
                {activeZones.size > 0 ? `ALERTS: ${activeZones.size}` : 'STATUS: NOMINAL'}
              </text>

              {/* Corner brackets */}
              <path d="M 5 5 L 5 25 M 5 5 L 25 5" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
              <path d="M 395 5 L 395 25 M 395 5 L 375 5" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
              <path d="M 5 675 L 5 655 M 5 675 L 25 675" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
              <path d="M 395 675 L 395 655 M 395 675 L 375 675" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
            </svg>
          </div>

          {/* Rotation controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={() => setRotateY(r => r - 15)}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
            >
              ←
            </button>
            <span className="text-xs text-slate-500">{rotateY}°</span>
            <button
              onClick={() => setRotateY(r => r + 15)}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
            >
              →
            </button>
            <button
              onClick={() => setRotateY(0)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Zone details */}
        <div>
          {selectedZoneData ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${activeZones.has(selectedZoneData.id) ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                  {selectedZoneData.name}
                </h4>
                <div className="space-y-2">
                  {selectedZoneData.relatedParams.map((param) => {
                    const value = reading[param as keyof SensorReading];
                    if (value === undefined) return null;
                    return (
                      <div key={param} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                        <span className="text-sm text-slate-400">{getParamName(param)}</span>
                        <span className="text-sm font-mono font-medium text-slate-200">
                          {typeof value === 'number' ? value.toFixed(1) : value} <span className="text-xs text-slate-500">{getParamUnit(param)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {selectedZoneData.relatedParams.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Sin sensores directos en esta fase</p>
                  )}
                </div>
              </div>

              {/* Related anomalies */}
              {anomalies.filter(a => selectedZoneData.relatedAreas.includes(a.area)).length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <h5 className="text-sm font-medium text-red-300 mb-2">⚠ Anomalías Detectadas</h5>
                  <div className="space-y-2">
                    {anomalies
                      .filter(a => selectedZoneData.relatedAreas.includes(a.area))
                      .slice(0, 3)
                      .map((anomaly) => (
                        <div key={anomaly.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700">
                          <p className="text-xs text-slate-300">{anomaly.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Confianza: {(anomaly.confidence * 100).toFixed(0)}%</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>{anomaly.severity}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className={`p-3 rounded-xl border ${
                activeZones.has(selectedZoneData.id)
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <p className={`text-sm ${activeZones.has(selectedZoneData.id) ? 'text-red-300' : 'text-emerald-300'}`}>
                  {activeZones.has(selectedZoneData.id)
                    ? '⚠ Anomalía activa — Protocolo en ejecución'
                    : '✓ Zona dentro de parámetros normales'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <div className="text-5xl mb-4 opacity-50">🔍</div>
                <p className="text-slate-400 text-sm mb-2">Haz clic en una zona del cuerpo</p>
                <p className="text-xs text-slate-600">Las zonas se iluminan automáticamente cuando se detectan anomalías</p>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-400" />
                    <span>Crítico — Pulso activo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-orange-500/40 border border-orange-400" />
                    <span>Alto — Glow activo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-400" />
                    <span>Medio — Indicador</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" />
                    <span>Normal — Sin alerta</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getParamName(param: string): string {
  const names: Record<string, string> = {
    heartRate: 'Frecuencia Cardiaca',
    heartRateVariability: 'HRV',
    systolicBP: 'Presión Sistólica',
    diastolicBP: 'Presión Diastólica',
    temperature: 'Temperatura',
    skinTemperature: 'Temp. Piel',
    spo2: 'SpO2',
    stressIndex: 'Índice de Estrés',
    sleepQuality: 'Calidad de Sueño',
    co2Level: 'CO2 Ambiental',
    ambientTemp: 'Temp. Ambiente',
    noiseLevel: 'Nivel de Ruido',
    radiationDose: 'Radiación',
  };
  return names[param] || param;
}

function getParamUnit(param: string): string {
  const units: Record<string, string> = {
    heartRate: 'bpm',
    heartRateVariability: 'ms',
    systolicBP: 'mmHg',
    diastolicBP: 'mmHg',
    temperature: '°C',
    skinTemperature: '°C',
    spo2: '%',
    stressIndex: '/100',
    sleepQuality: '/100',
    co2Level: 'ppm',
    ambientTemp: '°C',
    noiseLevel: 'dB',
    radiationDose: 'mSv/h',
  };
  return units[param] || '';
}
