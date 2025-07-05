// Tipos básicos
export type Triplet = [number, number, number];
export type Vector3 = { x: number; y: number; z: number };

// Tipos de elementos estructurales
export interface StructuralNode {
  id: string;
  position: Triplet;
  type: 'joint' | 'support' | 'connection';
  material?: string;
  mass?: number;
  constraints?: string[];
}

export interface StructuralBeam {
  id: string;
  nodeIds: [string, string];
  profileType: 'IPE' | 'HEA' | 'HEB' | 'HEM' | 'custom';
  length: number;
  width: number;
  height: number;
  thickness?: number;
  material: string;
  elasticModulus: number;
  yieldStrength: number;
  mass: number;
  // Propiedades para física realista
  currentStress?: number;
  damageLevel?: number; // 0 = intacto, 1 = completamente dañado
  isBroken?: boolean;
  criticalStress?: number; // Esfuerzo crítico para rotura
  fatigueFactor?: number; // Factor de fatiga acumulada
}

export interface StructuralFoundation {
  id: string;
  type: 'dado' | 'pilar' | 'pedestal' | 'zapata';
  position: Triplet;
  dimensions: Triplet;
  material: string;
  soilResistance: number;
}

// Tipos de simulación
export interface SimulationConfig {
  gravity: Triplet;
  timeStep: number;
  iterations: number;
  damping: number;
  allowSleep: boolean;
}

export interface EarthquakeConfig {
  intensity: number;
  frequency: number;
  duration: number;
  direction: Triplet;
  type: 'horizontal' | 'vertical' | 'rotational';
}

export interface MaterialProperties {
  name: string;
  density: number;
  elasticModulus: number;
  yieldStrength: number;
  ultimateStrength: number;
  poissonRatio: number;
}

// Tipos de análisis
export interface StructuralAnalysis {
  maxDisplacement: number;
  maxStress: number;
  safetyFactor: number;
  criticalElements: string[];
  recommendations: string[];
}

export interface SimulationResult {
  timestamp: number;
  nodePositions: Record<string, Triplet>;
  beamStresses: Record<string, number>;
  foundationReactions: Record<string, Triplet>;
  analysis: StructuralAnalysis;
}

// Tipos de UI
export type ToolMode = 'view' | 'analyze' | 'simulate' | 'design';
export type ViewMode = 'wireframe' | 'solid' | 'stress' | 'deformation';

export interface UIConfig {
  toolMode: ToolMode;
  viewMode: ViewMode;
  showGrid: boolean;
  showLabels: boolean;
  showForces: boolean;
  showStresses: boolean;
}

// Tipos de estructura completa
export interface StructuralModel {
  nodes: StructuralNode[];
  beams: StructuralBeam[];
  foundations: StructuralFoundation[];
  materials: Record<string, MaterialProperties>;
  simulationConfig: SimulationConfig;
  uiConfig: UIConfig;
}

// Tipos de eventos
export interface SimulationEvent {
  type: 'earthquake' | 'load' | 'impact' | 'settlement';
  timestamp: number;
  intensity: number;
  duration: number;
  affectedElements: string[];
}

// Tipos para física realista
export interface DamageEvent {
  type: 'element_broken' | 'progressive_collapse';
  timestamp: number;
  elementId: string;
  stressLevel: number;
  damageLevel: number;
  cause: string;
}

export interface StructuralIntegrity {
  overallHealth: number; // 0-100%
  criticalElements: string[];
  damageEvents: DamageEvent[];
  collapseRisk: number; // 0-100%
  remainingCapacity: number; // % de capacidad restante
}

// Nuevos tipos para simulación física de colapso
export interface PhysicsBody {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;
  isBroken: boolean;
  isFalling: boolean;
  collisionRadius: number;
  connectedElements: string[];
}

export interface CollisionEvent {
  elementId: string;
  collidedWith: string;
  impactForce: number;
  timestamp: number;
  position: [number, number, number];
}

export interface FallingElement {
  elementId: string;
  originalPosition: [number, number, number];
  currentPosition: [number, number, number];
  velocity: [number, number, number];
  mass: number;
  isOnGround: boolean;
  impactEnergy: number;
  hasCollided: boolean;
}

export interface CollapseSimulation {
  fallingElements: FallingElement[];
  collisionEvents: CollisionEvent[];
  groundLevel: number;
  gravity: [number, number, number];
  airResistance: number;
  groundFriction: number;
  isActive: boolean;
  timestamp: number;
}

// Tipos de exportación
export interface ExportFormat {
  type: 'json' | 'csv' | 'pdf' | 'stl';
  data: any;
  metadata: {
    version: string;
    timestamp: number;
    description: string;
  };
} 