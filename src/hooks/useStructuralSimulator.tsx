import { useCallback, useReducer, useEffect } from 'react';
import { 
  StructuralModel, 
  SimulationConfig, 
  EarthquakeConfig, 
  StructuralAnalysis, 
  SimulationResult,
  UIConfig
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
    const defaultModel: StructuralModel = {
      nodes: [
        // Nodos de fundación
        { id: 'FOUNDATION_1', position: [-3, 0, -3], type: 'support', material: 'concrete_C25' },
        { id: 'FOUNDATION_2', position: [3, 0, -3], type: 'support', material: 'concrete_C25' },
        { id: 'FOUNDATION_3', position: [-3, 0, 3], type: 'support', material: 'concrete_C25' },
        { id: 'FOUNDATION_4', position: [3, 0, 3], type: 'support', material: 'concrete_C25' },
        
        // Nodos de primer piso
        { id: 'NODE_1', position: [-3, 3, -3], type: 'joint', material: 'steel_S235', mass: 100 },
        { id: 'NODE_2', position: [3, 3, -3], type: 'joint', material: 'steel_S235', mass: 100 },
        { id: 'NODE_3', position: [-3, 3, 3], type: 'joint', material: 'steel_S235', mass: 100 },
        { id: 'NODE_4', position: [3, 3, 3], type: 'joint', material: 'steel_S235', mass: 100 },
        
        // Nodos de segundo piso
        { id: 'NODE_5', position: [-3, 6, -3], type: 'joint', material: 'steel_S235', mass: 80 },
        { id: 'NODE_6', position: [3, 6, -3], type: 'joint', material: 'steel_S235', mass: 80 },
        { id: 'NODE_7', position: [-3, 6, 3], type: 'joint', material: 'steel_S235', mass: 80 },
        { id: 'NODE_8', position: [3, 6, 3], type: 'joint', material: 'steel_S235', mass: 80 },
        
        // Nodos de techo
        { id: 'NODE_9', position: [0, 9, 0], type: 'joint', material: 'steel_S235', mass: 60 }
      ],
      beams: [
        // Vigas de primer piso
        { 
          id: 'BEAM_1', 
          nodeIds: ['NODE_1', 'NODE_2'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_2', 
          nodeIds: ['NODE_3', 'NODE_4'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_3', 
          nodeIds: ['NODE_1', 'NODE_3'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_4', 
          nodeIds: ['NODE_2', 'NODE_4'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        
        // Vigas de segundo piso
        { 
          id: 'BEAM_5', 
          nodeIds: ['NODE_5', 'NODE_6'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_6', 
          nodeIds: ['NODE_7', 'NODE_8'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_7', 
          nodeIds: ['NODE_5', 'NODE_7'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'BEAM_8', 
          nodeIds: ['NODE_6', 'NODE_8'], 
          profileType: 'IPE', 
          length: 6, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        
        // Columnas
        { 
          id: 'COLUMN_1', 
          nodeIds: ['FOUNDATION_1', 'NODE_1'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_2', 
          nodeIds: ['FOUNDATION_2', 'NODE_2'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_3', 
          nodeIds: ['FOUNDATION_3', 'NODE_3'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_4', 
          nodeIds: ['FOUNDATION_4', 'NODE_4'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        
        // Columnas de segundo piso
        { 
          id: 'COLUMN_5', 
          nodeIds: ['NODE_1', 'NODE_5'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_6', 
          nodeIds: ['NODE_2', 'NODE_6'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_7', 
          nodeIds: ['NODE_3', 'NODE_7'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        { 
          id: 'COLUMN_8', 
          nodeIds: ['NODE_4', 'NODE_8'], 
          profileType: 'HEA', 
          length: 3, 
          width: 0.1, 
          height: 100, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 16.7
        },
        
        // Vigas de techo
        { 
          id: 'ROOF_1', 
          nodeIds: ['NODE_5', 'NODE_9'], 
          profileType: 'IPE', 
          length: 4.24, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'ROOF_2', 
          nodeIds: ['NODE_6', 'NODE_9'], 
          profileType: 'IPE', 
          length: 4.24, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'ROOF_3', 
          nodeIds: ['NODE_7', 'NODE_9'], 
          profileType: 'IPE', 
          length: 4.24, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        },
        { 
          id: 'ROOF_4', 
          nodeIds: ['NODE_8', 'NODE_9'], 
          profileType: 'IPE', 
          length: 4.24, 
          width: 0.1, 
          height: 200, 
          material: 'steel_S235',
          elasticModulus: 210000,
          yieldStrength: 235,
          mass: 22.4
        }
      ],
      foundations: [
        {
          id: 'DADO_1',
          type: 'dado',
          position: [-3, -1.5, -3],
          dimensions: [1.7, 1.5, 1.5],
          material: 'concrete_C25',
          soilResistance: 250
        },
        {
          id: 'DADO_2',
          type: 'dado',
          position: [3, -1.5, -3],
          dimensions: [1.7, 1.5, 1.5],
          material: 'concrete_C25',
          soilResistance: 250
        },
        {
          id: 'DADO_3',
          type: 'dado',
          position: [-3, -1.5, 3],
          dimensions: [1.7, 1.5, 1.5],
          material: 'concrete_C25',
          soilResistance: 250
        },
        {
          id: 'DADO_4',
          type: 'dado',
          position: [3, -1.5, 3],
          dimensions: [1.7, 1.5, 1.5],
          material: 'concrete_C25',
          soilResistance: 250
        }
      ],
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