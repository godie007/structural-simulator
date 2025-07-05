import * as THREE from 'three';

// Proporciones estándar para HEA e IPE (en metros, escala visual)
const HEA = {
  width: 0.3, // ancho total
  height: 0.3, // alto total
  flange: 0.015, // espesor de ala
  web: 0.01 // espesor de alma
};

const IPE = {
  width: 0.18,
  height: 0.3,
  flange: 0.012,
  web: 0.007
};

export function createHEAShape() {
  const { width, height, flange, web } = HEA;
  const shape = new THREE.Shape();
  // Dibuja la "H" (HEA)
  shape.moveTo(-width/2, -height/2);
  shape.lineTo(-width/2, height/2);
  shape.lineTo(-width/2 + flange, height/2);
  shape.lineTo(-width/2 + flange, web/2);
  shape.lineTo(width/2 - flange, web/2);
  shape.lineTo(width/2 - flange, height/2);
  shape.lineTo(width/2, height/2);
  shape.lineTo(width/2, -height/2);
  shape.lineTo(width/2 - flange, -height/2);
  shape.lineTo(width/2 - flange, -web/2);
  shape.lineTo(-width/2 + flange, -web/2);
  shape.lineTo(-width/2 + flange, -height/2);
  shape.lineTo(-width/2, -height/2);
  return shape;
}

export function createIPEShape() {
  const { width, height, flange, web } = IPE;
  const shape = new THREE.Shape();
  // Dibuja la "I" (IPE)
  shape.moveTo(-width/2, -height/2);
  shape.lineTo(-width/2, -height/2 + flange);
  shape.lineTo(-web/2, -height/2 + flange);
  shape.lineTo(-web/2, height/2 - flange);
  shape.lineTo(-width/2, height/2 - flange);
  shape.lineTo(-width/2, height/2);
  shape.lineTo(width/2, height/2);
  shape.lineTo(width/2, height/2 - flange);
  shape.lineTo(web/2, height/2 - flange);
  shape.lineTo(web/2, -height/2 + flange);
  shape.lineTo(width/2, -height/2 + flange);
  shape.lineTo(width/2, -height/2);
  shape.lineTo(-width/2, -height/2);
  return shape;
}

// Utilidad para crear geometría extruida
export function createProfileGeometry(shape: THREE.Shape, length: number) {
  return new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: length,
    bevelEnabled: false
  });
}

// Extrusión a lo largo de una curva (para flexión visual)
export function createProfileGeometryAlongCurve(shape: THREE.Shape, curve: THREE.Curve<THREE.Vector3>, steps = 20) {
  return new THREE.ExtrudeGeometry(shape, {
    steps,
    extrudePath: curve,
    bevelEnabled: false
  });
} 