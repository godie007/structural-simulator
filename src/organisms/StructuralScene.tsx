import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

import * as THREE from 'three';
import { 
  StructuralNode, 
  StructuralBeam, 
  StructuralFoundation, 
  SimulationConfig, 
  EarthquakeConfig, 
  ViewMode,
  CollapseSimulation
} from '../types';
import { createHEAShape, createIPEShape, createProfileGeometry } from '../utils/profileGeometries';


interface StructuralSceneProps {
  nodes: StructuralNode[];
  beams: StructuralBeam[];
  foundations: StructuralFoundation[];
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  viewMode: ViewMode;
  isSimulating: boolean;
  selectedElement: StructuralBeam | null;
  collapseSimulation?: CollapseSimulation | null;
  onNodePositionUpdate?: (nodeId: string, position: [number, number, number]) => void;
  onElementSelect?: (element: StructuralBeam | null) => void;
}

// Utilidad para obtener nodos por id
const getNodeById = (nodes: StructuralNode[], id: string) => nodes.find(n => n.id === id);

// Componente para el plano y fundaciones que se mueven juntos
const MovingGround: React.FC<{
  foundations: StructuralFoundation[];
  children: React.ReactNode;
  isSimulating: boolean;
  earthquakeConfig: EarthquakeConfig;
}> = ({ foundations, children, isSimulating, earthquakeConfig }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current && isSimulating && earthquakeConfig.intensity > 0) {
      const intensity = earthquakeConfig.intensity;
      const frequency = earthquakeConfig.frequency;
      let shakeX = 0, shakeY = 0, shakeZ = 0;
      switch (earthquakeConfig.type) {
        case 'horizontal':
          shakeX = Math.sin(clock.elapsedTime * frequency) * 0.1 * intensity;
          shakeZ = Math.cos(clock.elapsedTime * frequency * 0.8) * 0.1 * intensity;
          break;
        case 'vertical':
          shakeY = Math.sin(clock.elapsedTime * frequency) * 0.1 * intensity;
          break;
        case 'rotational':
          shakeX = Math.sin(clock.elapsedTime * frequency) * 0.1 * intensity;
          shakeY = Math.cos(clock.elapsedTime * frequency * 1.2) * 0.1 * intensity;
          shakeZ = Math.sin(clock.elapsedTime * frequency * 0.6) * 0.1 * intensity;
          break;
      }
      groupRef.current.position.set(shakeX, shakeY, shakeZ);
      groupRef.current.rotation.set(shakeY * 0.1, shakeZ * 0.1, shakeX * 0.1);
    } else if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
    }
  });
  return (
    <group ref={groupRef}>
      {/* Plano base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      {/* Grid helper */}
      <gridHelper args={[100, 100, '#6b7280', '#6b7280']} position={[0, 0.01, 0]} />
      {/* Fundaciones (dados y pedestales) */}
      {foundations.map((foundation) => {
        const { type, position, dimensions } = foundation;
        const color = type === 'dado' ? '#bdbdbd' : type === 'pedestal' ? '#bbb' : '#888';
        if (type === 'dado') {
          return (
            <mesh key={foundation.id} position={[position[0], position[1], position[2]]} castShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
            </mesh>
          );
        }
        // Pedestal o pilar corto
        return (
          <mesh key={foundation.id} position={[position[0], position[1] + dimensions[1]/2, position[2]]} castShadow>
            <cylinderGeometry args={[dimensions[0]/2, dimensions[0]/2, dimensions[1], 16]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.9} />
          </mesh>
        );
      })}
      {children}
    </group>
  );
};

// Componente para columnas (HEA)
const Column: React.FC<{ 
  from: [number, number, number]; 
  to: [number, number, number]; 
  damageLevel?: number;
  isBroken?: boolean;
  beam: StructuralBeam;
  isSelected: boolean;
  onClick: () => void;
}> = ({ from, to, damageLevel = 0, isBroken = false, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = delta.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());

  // Determinar color basado en el daño y selección
  let color = "#374151";
  let isCritical = false;
  
  if (isSelected) {
    color = "#3b82f6";
  } else if (isBroken) {
    color = "#dc2626";
  } else if (damageLevel > 0.7) {
    color = "#ea580c";
    isCritical = true;
  } else if (damageLevel > 0.5) {
    color = "#f59e0b";
    isCritical = true;
  } else if (damageLevel > 0.3) {
    color = "#ca8a04";
  }

  // Animación pulsante para elementos críticos
  useFrame(({ clock }) => {
    if (meshRef.current && isCritical && !isSelected) {
      const pulseFactor = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 4);
      meshRef.current.scale.setScalar(pulseFactor);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  // Geometría HEA
  const shape = createHEAShape();
  const geometry = createProfileGeometry(shape, length);
  geometry.center();

  return (
    <group position={mid.toArray()} quaternion={quaternion}>
      <mesh 
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        onClick={onClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
        userData={{ isElement: true }}
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Componente para vigas (IPE)
const Beam: React.FC<{ 
  from: [number, number, number]; 
  to: [number, number, number];
  damageLevel?: number;
  isBroken?: boolean;
  beam: StructuralBeam;
  isSelected: boolean;
  onClick: () => void;
}> = ({ from, to, damageLevel = 0, isBroken = false, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = delta.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());

  // Determinar color basado en el daño y selección
  let color = "#374151";
  let isCritical = false;
  
  if (isSelected) {
    color = "#3b82f6";
  } else if (isBroken) {
    color = "#dc2626";
  } else if (damageLevel > 0.7) {
    color = "#ea580c";
    isCritical = true;
  } else if (damageLevel > 0.5) {
    color = "#f59e0b";
    isCritical = true;
  } else if (damageLevel > 0.3) {
    color = "#ca8a04";
  }

  // Animación pulsante para elementos críticos
  useFrame(({ clock }) => {
    if (meshRef.current && isCritical && !isSelected) {
      const pulseFactor = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 4);
      meshRef.current.scale.setScalar(pulseFactor);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  // Geometría IPE
  const shape = createIPEShape();
  const geometry = createProfileGeometry(shape, length);
  geometry.center();

  return (
    <group position={mid.toArray()} quaternion={quaternion}>
      <mesh 
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        onClick={onClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
        userData={{ isElement: true }}
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Componente para efecto de cámara durante colapso
const CameraShake: React.FC<{ isCollapsing: boolean }> = ({ isCollapsing }) => {
  useFrame(({ camera, clock }) => {
    if (isCollapsing) {
      const intensity = 0.3;
      const shakeX = Math.sin(clock.elapsedTime * 25) * intensity;
      const shakeY = Math.cos(clock.elapsedTime * 30) * intensity;
      const shakeZ = Math.sin(clock.elapsedTime * 20) * intensity;
      
      camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
    }
  });
  return null;
};

// Escena principal
const SceneContent: React.FC<StructuralSceneProps> = (props) => {
  const { nodes, beams, foundations, earthquakeConfig, isSimulating, selectedElement, collapseSimulation, onElementSelect } = props;

  // Mover aquí la declaración de foundationNodes
  const foundationNodes = nodes.filter(n => n.id.startsWith('FOUNDATION_'));

  // Identificar nodos de fundación y nodos superiores
  const upperNodes = nodes.filter(n => !n.id.startsWith('FOUNDATION_'));

  // Mapear columnas (todas las columnas del modelo)
  const columnBeams = beams.filter(beam => beam.profileType === 'HEA');
  const columns = columnBeams.map(beam => {
    const nodeA = getNodeById(nodes, beam.nodeIds[0]);
    const nodeB = getNodeById(nodes, beam.nodeIds[1]);
    if (!nodeA || !nodeB) return null;
    return (
      <Column 
        key={beam.id} 
        from={nodeA.position} 
        to={nodeB.position}
        damageLevel={beam.damageLevel}
        isBroken={beam.isBroken}
        beam={beam}
        isSelected={selectedElement?.id === beam.id}
        onClick={() => onElementSelect?.(beam)}
      />
    );
  });

  // Mapear vigas (solo las que no son columnas)
  const beamMeshes = beams.filter(beam => beam.profileType !== 'HEA').map(beam => {
    const nodeA = getNodeById(nodes, beam.nodeIds[0]);
    const nodeB = getNodeById(nodes, beam.nodeIds[1]);
    if (!nodeA || !nodeB) return null;
    return (
      <Beam 
        key={beam.id} 
        from={nodeA.position} 
        to={nodeB.position}
        damageLevel={beam.damageLevel}
        isBroken={beam.isBroken}
        beam={beam}
        isSelected={selectedElement?.id === beam.id}
        onClick={() => onElementSelect?.(beam)}
      />
    );
  });

  // Nodos superiores como esferas
  const upperNodeSpheres = upperNodes.map(node => (
    <mesh key={node.id} position={node.position} castShadow>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.2} />
    </mesh>
  ));

  // Resaltado para elemento seleccionado
  const selectedElementHighlight = selectedElement ? (() => {
    const nodeA = getNodeById(nodes, selectedElement.nodeIds[0]);
    const nodeB = getNodeById(nodes, selectedElement.nodeIds[1]);
    if (!nodeA || !nodeB) return null;

    const start = new THREE.Vector3(...nodeA.position);
    const end = new THREE.Vector3(...nodeB.position);
    const delta = new THREE.Vector3().subVectors(end, start);
    const length = delta.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());

    return (
      <mesh 
        position={mid.toArray()} 
        quaternion={quaternion}
        userData={{ isElement: true }}
      >
        <cylinderGeometry args={[0.25, 0.25, length, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
    );
  })() : null;

  // Elementos que están cayendo
  const fallingElements = collapseSimulation?.fallingElements.map(element => {
    const beam = beams.find(b => b.id === element.elementId);
    if (!beam) return null;

    const nodeA = getNodeById(nodes, beam.nodeIds[0]);
    const nodeB = getNodeById(nodes, beam.nodeIds[1]);
    if (!nodeA || !nodeB) return null;

    // Calcular dirección original del elemento
    const originalStart = new THREE.Vector3(...nodeA.position);
    const originalEnd = new THREE.Vector3(...nodeB.position);
    const originalDelta = new THREE.Vector3().subVectors(originalEnd, originalStart);
    const length = originalDelta.length();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, originalDelta.clone().normalize());

    // Usar la posición actual del elemento que está cayendo
    const currentPosition = element.currentPosition;

    // Determinar color basado en el estado
    let color = "#dc2626"; // Rojo por defecto
    if (element.isOnGround) {
      color = "#7f1d1d"; // Rojo oscuro cuando está en el suelo
    } else if (element.impactEnergy > 1000) {
      color = "#ea580c"; // Naranja si tiene mucha energía de impacto
    }

    return (
      <mesh 
        key={`falling-${element.elementId}`}
        position={currentPosition} 
        quaternion={quaternion}
        userData={{ isElement: true, isFalling: true }}
      >
        <cylinderGeometry args={[0.2, 0.2, length, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
    );
  }) || [];

  // Verificar si hay colapso activo
  const isCollapsing = Boolean(collapseSimulation?.isActive && collapseSimulation.fallingElements.length > 0);

  return (
    <>
      <OrbitControls enablePan enableZoom enableRotate />
      <CameraShake isCollapsing={isCollapsing} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow />
      
      {/* Fondo invisible para detectar clics en espacio vacío */}
      <mesh 
        position={[0, 0, 0]} 
        onClick={() => onElementSelect?.(null)}
        onPointerOver={(e) => {
          if (!e.object.userData.isElement) {
            document.body.style.cursor = 'default';
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <MovingGround
        foundations={foundations}
        isSimulating={isSimulating}
        earthquakeConfig={earthquakeConfig}
      >
        {/* Renderizar columnas, vigas y nodos superiores */}
        {columns}
        {beamMeshes}
        {upperNodeSpheres}
        {selectedElementHighlight}
        {/* Renderizar elementos que están cayendo */}
        {fallingElements}
      </MovingGround>
      {/* Indicador de simulación */}
      {isSimulating && (
        <Suspense fallback={null}>
          <Text position={[0, 20, 0]} color="#ef4444" fontSize={1} anchorX="center">
            SIMULACIÓN DE TERREMOTO - {earthquakeConfig.intensity.toFixed(1)} Richter
          </Text>
        </Suspense>
      )}
    </>
  );
};

const StructuralScene: React.FC<StructuralSceneProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 8, 20], fov: 60 }}
      shadows
      className="cursor-crosshair bg-gray-900"
    >
      <SceneContent {...props} />
    </Canvas>
  );
};

export default StructuralScene; 