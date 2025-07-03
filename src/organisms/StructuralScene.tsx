import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { 
  StructuralNode, 
  StructuralBeam, 
  StructuralFoundation, 
  SimulationConfig,
  EarthquakeConfig,
  ViewMode 
} from '../types';
import { PROFILE_DIMENSIONS } from '../constants/materials';

interface StructuralSceneProps {
  nodes: StructuralNode[];
  beams: StructuralBeam[];
  foundations: StructuralFoundation[];
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  viewMode: ViewMode;
  isSimulating: boolean;
  onNodePositionUpdate?: (nodeId: string, position: [number, number, number]) => void;
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

// Componente para columnas (pilares)
const Column: React.FC<{ from: [number, number, number]; to: [number, number, number]; height?: number; }>
 = ({ from, to, height }) => {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = delta.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[0.15, 0.15, length, 16]} />
      <meshStandardMaterial color="#888" metalness={0.3} roughness={0.7} />
    </mesh>
  );
};

// Componente para vigas
const Beam: React.FC<{ from: [number, number, number]; to: [number, number, number]; }>
 = ({ from, to }) => {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = delta.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[0.09, 0.09, length, 12]} />
      <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
    </mesh>
  );
};

// Escena principal
const SceneContent: React.FC<StructuralSceneProps> = (props) => {
  const { nodes, beams, foundations, earthquakeConfig, viewMode, isSimulating } = props;

  // Identificar nodos de fundación y nodos superiores
  const foundationNodes = nodes.filter(n => n.id.startsWith('FOUNDATION_'));
  const upperNodes = nodes.filter(n => !n.id.startsWith('FOUNDATION_'));

  // Mapear columnas (de cada dado a su nodo superior)
  const columns = foundationNodes.map(fNode => {
    const upper = upperNodes.find(n => Math.abs(n.position[0] - fNode.position[0]) < 0.1 && Math.abs(n.position[2] - fNode.position[2]) < 0.1 && n.position[1] > fNode.position[1]);
    if (!upper) return null;
    return <Column key={fNode.id + '-' + upper.id} from={fNode.position} to={upper.position} />;
  });

  // Mapear vigas
  const beamMeshes = beams.map(beam => {
    const nodeA = getNodeById(nodes, beam.nodeIds[0]);
    const nodeB = getNodeById(nodes, beam.nodeIds[1]);
    if (!nodeA || !nodeB) return null;
    return <Beam key={beam.id} from={nodeA.position} to={nodeB.position} />;
  });

  // Nodos superiores como esferas
  const upperNodeSpheres = upperNodes.map(node => (
    <mesh key={node.id} position={node.position} castShadow>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.2} />
    </mesh>
  ));

  return (
    <>
      <OrbitControls enablePan enableZoom enableRotate />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow />
      <MovingGround
        foundations={foundations}
        isSimulating={isSimulating}
        earthquakeConfig={earthquakeConfig}
      >
        {/* Renderizar columnas, vigas y nodos superiores */}
        {columns}
        {beamMeshes}
        {upperNodeSpheres}
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