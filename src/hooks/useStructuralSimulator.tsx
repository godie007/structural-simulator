import { useCallback, useReducer, useEffect } from 'react';
import { 
  StructuralModel, 
  SimulationConfig, 
  EarthquakeConfig, 
  StructuralAnalysis, 
  SimulationResult,
  UIConfig,
  StructuralNode,
  StructuralBeam
} from '../types';
import { MATERIALS } from '../constants/materials';
import { StructuralAnalysisService } from '../services/structuralAnalysis';

// Estado inicial del simulador
const initialSimulationConfig: SimulationConfig = {
  gravity: [0, -9.81, 0],
  timeStep: 0.016,
  iterations: 10,
  damping: 0.1,
  allowSleep: true
};

const initialEarthquakeConfig: EarthquakeConfig = {
  intensity: 0,
  frequency: 10,
  duration: 10,
  direction: [1, 0, 0],
  type: 'horizontal'
};

const initialUIConfig: UIConfig = {
  toolMode: 'view',
  viewMode: 'solid',
  showGrid: true,
  showLabels: true,
  showForces: false,
  showStresses: false
};

// Acciones del reducer
type SimulatorAction =
  | { type: 'SET_SIMULATION_CONFIG'; payload: SimulationConfig }
  | { type: 'SET_EARTHQUAKE_CONFIG'; payload: EarthquakeConfig }
  | { type: 'SET_UI_CONFIG'; payload: UIConfig }
  | { type: 'SET_IS_SIMULATING'; payload: boolean }
  | { type: 'SET_IS_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS_RESULT'; payload: StructuralAnalysis | null }
  | { type: 'ADD_SIMULATION_RESULT'; payload: SimulationResult }
  | { type: 'UPDATE_NODE_POSITION'; payload: { nodeId: string; position: [number, number, number] } }
  | { type: 'LOAD_STRUCTURAL_MODEL'; payload: StructuralModel };

interface SimulatorState {
  structuralModel: StructuralModel | null;
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  uiConfig: UIConfig;
  isSimulating: boolean;
  isAnalyzing: boolean;
  analysisResult: StructuralAnalysis | null;
  simulationResults: SimulationResult[];
}

const initialState: SimulatorState = {
  structuralModel: null,
  simulationConfig: initialSimulationConfig,
  earthquakeConfig: initialEarthquakeConfig,
  uiConfig: initialUIConfig,
  isSimulating: false,
  isAnalyzing: false,
  analysisResult: null,
  simulationResults: []
};

const simulatorReducer = (state: SimulatorState, action: SimulatorAction): SimulatorState => {
  switch (action.type) {
    case 'SET_SIMULATION_CONFIG':
      return { ...state, simulationConfig: action.payload };
    
    case 'SET_EARTHQUAKE_CONFIG':
      return { ...state, earthquakeConfig: action.payload };
    
    case 'SET_UI_CONFIG':
      return { ...state, uiConfig: action.payload };
    
    case 'SET_IS_SIMULATING':
      return { ...state, isSimulating: action.payload };
    
    case 'SET_IS_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    
    case 'SET_ANALYSIS_RESULT':
      return { ...state, analysisResult: action.payload };
    
    case 'ADD_SIMULATION_RESULT':
      return { 
        ...state, 
        simulationResults: [...state.simulationResults, action.payload].slice(-10) // Mantener solo los últimos 10
      };
    
    case 'UPDATE_NODE_POSITION':
      if (!state.structuralModel) return state;
      return {
        ...state,
        structuralModel: {
          ...state.structuralModel,
          nodes: state.structuralModel.nodes.map(node =>
            node.id === action.payload.nodeId
              ? { ...node, position: action.payload.position }
              : node
          )
        }
      };
    
    case 'LOAD_STRUCTURAL_MODEL':
      return { ...state, structuralModel: action.payload };
    
    default:
      return state;
  }
};

export const useStructuralSimulator = () => {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  // Cargar estructura por defecto
  useEffect(() => {
    // Altura del dado
    const dadoAltura = 1.5;
    // La parte superior del dado está en y = -1.5 + 1.5/2 = -0.75
    const dadoTopY = -0.75;
    // La base del dado está en y = -1.5 - 1.5/2 = -2.25
    const dadoBaseY = -2.25;
    // Altura de los pilares
    const alturaPilar = 7;
    // Primer piso
    const primerPisoY = dadoTopY + alturaPilar;
    // Segundo piso
    const segundoPisoY = primerPisoY + 3;
    // Techo
    const techoY = segundoPisoY + 2;
    
    // Posiciones de los dados
    const dados = [
      { id: 'DADO_1', pos: [-3, -1.5, -3] },
      { id: 'DADO_2', pos: [3, -1.5, -3] },
      { id: 'DADO_3', pos: [-3, -1.5, 3] },
      { id: 'DADO_4', pos: [3, -1.5, 3] }
    ];
    
    // Esquinas relativas del dado (±0.6m para un dado de 1.2m de lado)
    const offset = 0.6;
    // Coordenadas de las esquinas relativas
    const esquinas = [
      [+offset, 0, +offset],
      [+offset, 0, -offset],
      [-offset, 0, +offset],
      [-offset, 0, -offset]
    ];
    
    // Nodos de fundación alineados con la parte superior del dado (centrados)
    const foundationNodes = [
      { id: 'FOUNDATION_1', position: [-3, dadoTopY, -3] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_2', position: [3, dadoTopY, -3] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_3', position: [-3, dadoTopY, 3] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_4', position: [3, dadoTopY, 3] as [number, number, number], type: 'support' as const, material: 'concrete_C25' }
    ];
    
    // Nodos y beams de los pilares bajo cada dado (parte inferior)
    let pilaresNodes: StructuralNode[] = [];
    let pilaresBeams: StructuralBeam[] = [];
    dados.forEach((dado, i) => {
      esquinas.forEach((esq, j) => {
        const topId = `PILAR_TOP_${i+1}_${j+1}`;
        const botId = `PILAR_BOT_${i+1}_${j+1}`;
        // Nodo superior (esquina del dado, parte inferior del dado)
        const topPos = [dado.pos[0] + esq[0], dadoBaseY, dado.pos[2] + esq[2]] as [number, number, number];
        // Nodo inferior (7m debajo)
        const botPos = [dado.pos[0] + esq[0], dadoBaseY - alturaPilar, dado.pos[2] + esq[2]] as [number, number, number];
        pilaresNodes.push(
          { id: topId, position: topPos, type: 'support' as const, material: 'concrete_C25' },
          { id: botId, position: botPos, type: 'support' as const, material: 'concrete_C25' }
        );
        pilaresBeams.push({
          id: `PILAR_${i+1}_${j+1}`,
          nodeIds: [topId, botId] as [string, string],
          profileType: 'HEA' as const,
          length: alturaPilar,
          width: 0.3,
          height: 30,
          material: 'concrete_C25',
          elasticModulus: 30000,
          yieldStrength: 25,
          mass: 1
        });
      });
    });
    
    // Nodos del primer piso (centrados en cada dado)
    const primerPisoNodes = [
      // Dado 1 - centrado en [-3, primerPisoY, -3]
      { id: 'NODE_1', position: [-3, primerPisoY, -3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 2 - centrado en [3, primerPisoY, -3]
      { id: 'NODE_2', position: [3, primerPisoY, -3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 3 - centrado en [-3, primerPisoY, 3]
      { id: 'NODE_3', position: [-3, primerPisoY, 3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 4 - centrado en [3, primerPisoY, 3]
      { id: 'NODE_4', position: [3, primerPisoY, 3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 }
    ];
    
    const nodes = [
      ...foundationNodes,
      ...pilaresNodes,
      ...primerPisoNodes,
      // Nodos segundo piso
      { id: 'NODE_17', position: [-3, segundoPisoY, -3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_18', position: [3, segundoPisoY, -3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_19', position: [-3, segundoPisoY, 3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_20', position: [3, segundoPisoY, 3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      // Cumbrera (techo)
      { id: 'NODE_21', position: [0, techoY, -3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 60 },
      { id: 'NODE_22', position: [0, techoY, 3] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 60 }
    ];
    const beams = [
      // Pilares bajo cada dado (parte inferior)
      ...pilaresBeams,
      // Columnas principales (desde fundación hasta primer piso)
      { id: 'COLUMN_1', nodeIds: ['FOUNDATION_1', 'NODE_1'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.3, height: 30, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'COLUMN_2', nodeIds: ['FOUNDATION_2', 'NODE_2'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.3, height: 30, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'COLUMN_3', nodeIds: ['FOUNDATION_3', 'NODE_3'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.3, height: 30, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'COLUMN_4', nodeIds: ['FOUNDATION_4', 'NODE_4'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.3, height: 30, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      // Vigas primer piso
      { id: 'BEAM_1', nodeIds: ['NODE_1', 'NODE_2'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_2', nodeIds: ['NODE_2', 'NODE_4'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_3', nodeIds: ['NODE_4', 'NODE_3'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_4', nodeIds: ['NODE_3', 'NODE_1'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      // Vigas segundo piso
      { id: 'BEAM_5', nodeIds: ['NODE_17', 'NODE_18'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_6', nodeIds: ['NODE_18', 'NODE_20'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_7', nodeIds: ['NODE_20', 'NODE_19'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      { id: 'BEAM_8', nodeIds: ['NODE_19', 'NODE_17'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 22.4 },
      // Vigas verticales (frente y fondo)
      { id: 'BEAM_9', nodeIds: ['NODE_1', 'NODE_17'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'BEAM_10', nodeIds: ['NODE_2', 'NODE_18'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'BEAM_11', nodeIds: ['NODE_3', 'NODE_19'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'BEAM_12', nodeIds: ['NODE_4', 'NODE_20'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      // Vigas inclinadas del techo
      { id: 'ROOF_1', nodeIds: ['NODE_17', 'NODE_21'] as [string, string], profileType: 'IPE' as const, length: 3.6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'ROOF_2', nodeIds: ['NODE_18', 'NODE_21'] as [string, string], profileType: 'IPE' as const, length: 3.6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'ROOF_3', nodeIds: ['NODE_19', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 3.6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      { id: 'ROOF_4', nodeIds: ['NODE_20', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 3.6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 },
      // Cumbrera
      { id: 'ROOF_5', nodeIds: ['NODE_21', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 6, width: 0.1, height: 200, material: 'steel_S235', elasticModulus: 210000, yieldStrength: 235, mass: 16.7 }
    ];
    const foundations = [
      { id: 'DADO_1', type: 'dado' as const, position: [-3, -1.5, -3] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_2', type: 'dado' as const, position: [3, -1.5, -3] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_3', type: 'dado' as const, position: [-3, -1.5, 3] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_4', type: 'dado' as const, position: [3, -1.5, 3] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 }
    ];
    const defaultModel: StructuralModel = {
      nodes,
      beams,
      foundations,
      materials: MATERIALS,
      simulationConfig: initialSimulationConfig,
      uiConfig: initialUIConfig
    };

    dispatch({ type: 'LOAD_STRUCTURAL_MODEL', payload: defaultModel });
  }, []);

  // Funciones de control
  const updateSimulationConfig = useCallback((config: SimulationConfig) => {
    dispatch({ type: 'SET_SIMULATION_CONFIG', payload: config });
  }, []);

  const updateEarthquakeConfig = useCallback((config: EarthquakeConfig) => {
    dispatch({ type: 'SET_EARTHQUAKE_CONFIG', payload: config });
  }, []);

  const updateUIConfig = useCallback((config: UIConfig) => {
    dispatch({ type: 'SET_UI_CONFIG', payload: config });
  }, []);

  const startSimulation = useCallback(() => {
    dispatch({ type: 'SET_IS_SIMULATING', payload: true });
  }, []);

  const stopSimulation = useCallback(() => {
    dispatch({ type: 'SET_IS_SIMULATING', payload: false });
  }, []);

  const analyzeStructure = useCallback(async () => {
    dispatch({ type: 'SET_IS_ANALYZING', payload: true });
    
    if (state.structuralModel) {
      // Simular delay de análisis
      setTimeout(() => {
        const analysis = StructuralAnalysisService.analyzeStructure(state.structuralModel!);
        
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: analysis });
        dispatch({ type: 'SET_IS_ANALYZING', payload: false });
      }, 2000);
    } else {
      dispatch({ type: 'SET_IS_ANALYZING', payload: false });
    }
  }, [state.structuralModel]);

  const updateNodePosition = useCallback((nodeId: string, position: [number, number, number]) => {
    dispatch({ type: 'UPDATE_NODE_POSITION', payload: { nodeId, position } });
  }, []);

  const addSimulationResult = useCallback((result: SimulationResult) => {
    dispatch({ type: 'ADD_SIMULATION_RESULT', payload: result });
  }, []);

  return {
    // Estado
    structuralModel: state.structuralModel,
    simulationConfig: state.simulationConfig,
    earthquakeConfig: state.earthquakeConfig,
    uiConfig: state.uiConfig,
    isSimulating: state.isSimulating,
    isAnalyzing: state.isAnalyzing,
    analysisResult: state.analysisResult,
    simulationResults: state.simulationResults,
    
    // Funciones
    updateSimulationConfig,
    updateEarthquakeConfig,
    updateUIConfig,
    startSimulation,
    stopSimulation,
    analyzeStructure,
    updateNodePosition,
    addSimulationResult
  };
}; 