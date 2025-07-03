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