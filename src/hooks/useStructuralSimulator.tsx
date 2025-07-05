import { useCallback, useReducer, useEffect } from 'react';
import { 
  StructuralModel, 
  SimulationConfig, 
  EarthquakeConfig, 
  StructuralAnalysis, 
  SimulationResult,
  UIConfig,
  StructuralNode,
  StructuralBeam,
  CollapseSimulation
} from '../types';
import { MATERIALS } from '../constants/materials';
import { StructuralAnalysisService } from '../services/structuralAnalysis';
import { CollapsePhysicsService } from '../services/collapsePhysics';

// Estado inicial del simulador
const initialSimulationConfig: SimulationConfig = {
  gravity: [0, -9.81, 0],
  timeStep: 0.016,
  iterations: 10,
  damping: 0.1,
  allowSleep: true
};

const initialEarthquakeConfig: EarthquakeConfig = {
  intensity: 9.0, // Terremoto severo por defecto para colapso inmediato
  frequency: 20,
  duration: 20,
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
  | { type: 'LOAD_STRUCTURAL_MODEL'; payload: StructuralModel }
  | { type: 'UPDATE_BEAM_DAMAGE'; payload: { beamId: string; damageLevel: number; isBroken: boolean } }
  | { type: 'RESET_STRUCTURAL_DAMAGE' }
  | { type: 'SET_SELECTED_ELEMENT'; payload: StructuralBeam | null }
  | { type: 'UPDATE_BEAM_PROPERTIES'; payload: { beamId: string; updates: Partial<StructuralBeam> } }
  | { type: 'DELETE_ELEMENT'; payload: { elementId: string } }
  | { type: 'INITIALIZE_COLLAPSE_SIMULATION' }
  | { type: 'UPDATE_COLLAPSE_SIMULATION'; payload: CollapseSimulation }
  | { type: 'RESET_COLLAPSE_SIMULATION' };

interface SimulatorState {
  structuralModel: StructuralModel | null;
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  uiConfig: UIConfig;
  isSimulating: boolean;
  isAnalyzing: boolean;
  analysisResult: StructuralAnalysis | null;
  simulationResults: SimulationResult[];
  selectedElement: StructuralBeam | null;
  collapseSimulation: CollapseSimulation | null;
}

const initialState: SimulatorState = {
  structuralModel: null,
  simulationConfig: initialSimulationConfig,
  earthquakeConfig: initialEarthquakeConfig,
  uiConfig: initialUIConfig,
  isSimulating: false,
  isAnalyzing: false,
  analysisResult: null,
  simulationResults: [],
  selectedElement: null,
  collapseSimulation: null
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
    
    case 'UPDATE_BEAM_DAMAGE':
      if (!state.structuralModel) return state;
      return {
        ...state,
        structuralModel: {
          ...state.structuralModel,
          beams: state.structuralModel.beams.map(beam =>
            beam.id === action.payload.beamId
              ? { ...beam, damageLevel: action.payload.damageLevel, isBroken: action.payload.isBroken }
              : beam
          )
        }
      };
    
    case 'RESET_STRUCTURAL_DAMAGE':
      if (!state.structuralModel) return state;
      return {
        ...state,
        structuralModel: {
          ...state.structuralModel,
          beams: state.structuralModel.beams.map(beam => ({
            ...beam,
            damageLevel: 0,
            isBroken: false,
            currentStress: 0,
            fatigueFactor: 0
          }))
        }
      };
    
    case 'SET_SELECTED_ELEMENT':
      return { ...state, selectedElement: action.payload };
    
    case 'UPDATE_BEAM_PROPERTIES':
      if (!state.structuralModel) return state;
      return {
        ...state,
        structuralModel: {
          ...state.structuralModel,
          beams: state.structuralModel.beams.map(beam =>
            beam.id === action.payload.beamId
              ? { ...beam, ...action.payload.updates }
              : beam
          )
        }
      };

    case 'DELETE_ELEMENT':
      if (!state.structuralModel) return state;
      return {
        ...state,
        structuralModel: {
          ...state.structuralModel,
          beams: state.structuralModel.beams.filter(beam => beam.id !== action.payload.elementId)
        },
        selectedElement: state.selectedElement?.id === action.payload.elementId ? null : state.selectedElement
      };
    
    case 'INITIALIZE_COLLAPSE_SIMULATION':
      if (!state.structuralModel) return state;
      return {
        ...state,
        collapseSimulation: CollapsePhysicsService.initializeCollapseSimulation(
          state.structuralModel.beams,
          state.structuralModel.nodes
        )
      };
    
    case 'UPDATE_COLLAPSE_SIMULATION':
      return {
        ...state,
        collapseSimulation: action.payload
      };
    
    case 'RESET_COLLAPSE_SIMULATION':
      return {
        ...state,
        collapseSimulation: null
      };
    
    default:
      return state;
  }
};

export const useStructuralSimulator = () => {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  // Cargar estructura por defecto
  useEffect(() => {
    // Altura del dado

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
    
    // Posiciones de los dados (más separados)
    const dados = [
      { id: 'DADO_1', pos: [-5, -1.5, -5] },
      { id: 'DADO_2', pos: [5, -1.5, -5] },
      { id: 'DADO_3', pos: [-5, -1.5, 5] },
      { id: 'DADO_4', pos: [5, -1.5, 5] }
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
    
    // Nodos de fundación alineados con la parte superior del dado (más separados)
    const foundationNodes = [
      { id: 'FOUNDATION_1', position: [-5, dadoTopY, -5] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_2', position: [5, dadoTopY, -5] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_3', position: [-5, dadoTopY, 5] as [number, number, number], type: 'support' as const, material: 'concrete_C25' },
      { id: 'FOUNDATION_4', position: [5, dadoTopY, 5] as [number, number, number], type: 'support' as const, material: 'concrete_C25' }
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
          width: 0.15,
          height: 15,
          material: 'concrete_C25',
          elasticModulus: 15000,
          yieldStrength: 10,
          mass: 0.6
        });
      });
    });
    
    // Nodos del primer piso (más separados para vigas más largas)
    const primerPisoNodes = [
      // Dado 1 - más separado
      { id: 'NODE_1', position: [-5, primerPisoY, -5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 2 - más separado
      { id: 'NODE_2', position: [5, primerPisoY, -5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 3 - más separado
      { id: 'NODE_3', position: [-5, primerPisoY, 5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 },
      // Dado 4 - más separado
      { id: 'NODE_4', position: [5, primerPisoY, 5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 100 }
    ];
    
    const nodes = [
      ...foundationNodes,
      ...pilaresNodes,
      ...primerPisoNodes,
      // Nodos segundo piso (más separados)
      { id: 'NODE_17', position: [-5, segundoPisoY, -5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_18', position: [5, segundoPisoY, -5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_19', position: [-5, segundoPisoY, 5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      { id: 'NODE_20', position: [5, segundoPisoY, 5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 80 },
      // Cumbrera (techo) - más separada
      { id: 'NODE_21', position: [0, techoY, -5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 60 },
      { id: 'NODE_22', position: [0, techoY, 5] as [number, number, number], type: 'joint' as const, material: 'steel_S235', mass: 60 }
    ];
    const beams = [
      // Pilares bajo cada dado (parte inferior)
      ...pilaresBeams,
      // Columnas principales (desde fundación hasta primer piso) - Extremadamente débiles para colapso dramático
      { id: 'COLUMN_1', nodeIds: ['FOUNDATION_1', 'NODE_1'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.15, height: 15, material: 'steel_S235', elasticModulus: 100000, yieldStrength: 80, mass: 8.0 },
      { id: 'COLUMN_2', nodeIds: ['FOUNDATION_2', 'NODE_2'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.15, height: 15, material: 'steel_S235', elasticModulus: 100000, yieldStrength: 80, mass: 8.0 },
      { id: 'COLUMN_3', nodeIds: ['FOUNDATION_3', 'NODE_3'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.15, height: 15, material: 'steel_S235', elasticModulus: 100000, yieldStrength: 80, mass: 8.0 },
      { id: 'COLUMN_4', nodeIds: ['FOUNDATION_4', 'NODE_4'] as [string, string], profileType: 'HEA' as const, length: alturaPilar, width: 0.15, height: 15, material: 'steel_S235', elasticModulus: 100000, yieldStrength: 80, mass: 8.0 },
      // Vigas primer piso - Extremadamente débiles para colapso dramático
      { id: 'BEAM_1', nodeIds: ['NODE_1', 'NODE_2'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_2', nodeIds: ['NODE_2', 'NODE_4'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_3', nodeIds: ['NODE_4', 'NODE_3'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_4', nodeIds: ['NODE_3', 'NODE_1'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      // Vigas segundo piso - Extremadamente débiles para colapso dramático
      { id: 'BEAM_5', nodeIds: ['NODE_17', 'NODE_18'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_6', nodeIds: ['NODE_18', 'NODE_20'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_7', nodeIds: ['NODE_20', 'NODE_19'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_8', nodeIds: ['NODE_19', 'NODE_17'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      // Vigas verticales (frente y fondo) - Extremadamente débiles para colapso dramático
      { id: 'BEAM_9', nodeIds: ['NODE_1', 'NODE_17'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_10', nodeIds: ['NODE_2', 'NODE_18'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_11', nodeIds: ['NODE_3', 'NODE_19'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'BEAM_12', nodeIds: ['NODE_4', 'NODE_20'] as [string, string], profileType: 'IPE' as const, length: 3, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      // Vigas inclinadas del techo - Extremadamente débiles para colapso dramático
      { id: 'ROOF_1', nodeIds: ['NODE_17', 'NODE_21'] as [string, string], profileType: 'IPE' as const, length: 5.4, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'ROOF_2', nodeIds: ['NODE_18', 'NODE_21'] as [string, string], profileType: 'IPE' as const, length: 5.4, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'ROOF_3', nodeIds: ['NODE_19', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 5.4, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      { id: 'ROOF_4', nodeIds: ['NODE_20', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 5.4, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 },
      // Cumbrera - Extremadamente débil para colapso dramático
      { id: 'ROOF_5', nodeIds: ['NODE_21', 'NODE_22'] as [string, string], profileType: 'IPE' as const, length: 10, width: 0.05, height: 80, material: 'steel_S235', elasticModulus: 80000, yieldStrength: 60, mass: 8.0 }
    ];
    const foundations = [
      { id: 'DADO_1', type: 'dado' as const, position: [-5, -1.5, -5] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_2', type: 'dado' as const, position: [5, -1.5, -5] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_3', type: 'dado' as const, position: [-5, -1.5, 5] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 },
      { id: 'DADO_4', type: 'dado' as const, position: [5, -1.5, 5] as [number, number, number], dimensions: [1.7, 1.5, 1.5] as [number, number, number], material: 'concrete_C25', soilResistance: 250 }
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

  const updateBeamDamage = useCallback((beamId: string, damageLevel: number, isBroken: boolean) => {
    dispatch({ type: 'UPDATE_BEAM_DAMAGE', payload: { beamId, damageLevel, isBroken } });
  }, []);

  const resetStructuralDamage = useCallback(() => {
    dispatch({ type: 'RESET_STRUCTURAL_DAMAGE' });
  }, []);

  const selectElement = useCallback((element: StructuralBeam | null) => {
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element });
  }, []);

  const updateBeamProperties = useCallback((beamId: string, updates: Partial<StructuralBeam>) => {
    dispatch({ type: 'UPDATE_BEAM_PROPERTIES', payload: { beamId, updates } });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    dispatch({ type: 'DELETE_ELEMENT', payload: { elementId } });
  }, []);

  // Función para recalcular longitudes de elementos cuando se mueven nodos
  const updateNodePositionWithAdaptation = useCallback((nodeId: string, position: [number, number, number]) => {
    if (!state.structuralModel) return;
    
    // Actualizar posición del nodo
    updateNodePosition(nodeId, position);
    
    // Recalcular longitudes de elementos conectados
    const connectedBeams = state.structuralModel.beams.filter(beam => 
      beam.nodeIds.includes(nodeId)
    );
    
    connectedBeams.forEach(beam => {
      const nodeA = state.structuralModel!.nodes.find(n => n.id === beam.nodeIds[0]);
      const nodeB = state.structuralModel!.nodes.find(n => n.id === beam.nodeIds[1]);
      
      if (nodeA && nodeB) {
        const newLength = Math.sqrt(
          Math.pow(nodeB.position[0] - nodeA.position[0], 2) +
          Math.pow(nodeB.position[1] - nodeA.position[1], 2) +
          Math.pow(nodeB.position[2] - nodeA.position[2], 2)
        );
        
        updateBeamProperties(beam.id, { length: newLength });
      }
    });
  }, [state.structuralModel, updateNodePosition, updateBeamProperties]);

  // Funciones para simulación de colapso físico
  const initializeCollapseSimulation = useCallback(() => {
    dispatch({ type: 'INITIALIZE_COLLAPSE_SIMULATION' });
  }, []);

  const updateCollapseSimulation = useCallback((simulation: CollapseSimulation) => {
    dispatch({ type: 'UPDATE_COLLAPSE_SIMULATION', payload: simulation });
  }, []);

  const resetCollapseSimulation = useCallback(() => {
    dispatch({ type: 'RESET_COLLAPSE_SIMULATION' });
  }, []);

  // Efecto para actualizar la simulación de colapso en tiempo real
  useEffect(() => {
    if (!state.collapseSimulation?.isActive || !state.structuralModel) return;

    const interval = setInterval(() => {
      if (state.collapseSimulation && state.structuralModel) {
        // Actualizar la simulación física
        const updatedSimulation = CollapsePhysicsService.updateCollapseSimulation(
          state.collapseSimulation,
          state.structuralModel.beams,
          state.structuralModel.nodes
        );
        
        // Dispatch la simulación actualizada
        dispatch({ type: 'UPDATE_COLLAPSE_SIMULATION', payload: updatedSimulation });
      }
    }, 16); // 60 FPS

    return () => clearInterval(interval);
  }, [state.collapseSimulation?.isActive, state.structuralModel]);

  // Efecto para iniciar colapso cuando hay elementos rotos
  useEffect(() => {
    if (!state.structuralModel) return;

    const brokenBeams = state.structuralModel.beams.filter(beam => beam.isBroken);
    const hasBrokenElements = brokenBeams.length > 0;
    const hasCollapseSimulation = state.collapseSimulation !== null;

    if (hasBrokenElements && !hasCollapseSimulation) {
      initializeCollapseSimulation();
    } else if (!hasBrokenElements && hasCollapseSimulation) {
      resetCollapseSimulation();
    }
  }, [state.structuralModel?.beams, state.collapseSimulation, initializeCollapseSimulation, resetCollapseSimulation]);

  // Efecto para simular terremoto en tiempo real cuando está activa la simulación
  useEffect(() => {
    if (!state.isSimulating || !state.structuralModel) return;

    const interval = setInterval(() => {
      if (state.structuralModel) {
        // Simular terremoto y obtener resultados actualizados
        const simulationResult = StructuralAnalysisService.simulateEarthquake(
          state.structuralModel, 
          state.earthquakeConfig
        );

        // Calcular daño basado en esfuerzos actuales
        Object.entries(simulationResult.beamStresses).forEach(([beamId, stress]) => {
          const beam = state.structuralModel!.beams.find(b => b.id === beamId);
          if (beam && beam.currentStress !== stress) {
            // Calcular nuevo nivel de daño basado en el esfuerzo
            const material = state.structuralModel!.materials[beam.material];
            if (material) {
              const stressRatio = stress / material.yieldStrength;
              const damageIncrement = Math.max(0, stressRatio - 0.3) * 0.15; // Incremento muy agresivo
              const newDamage = Math.min(1, (beam.damageLevel || 0) + damageIncrement);
              const isBroken = newDamage >= 0.5 || stress >= material.yieldStrength * 0.8;
              
              // Solo actualizar si hay cambios significativos
              if (Math.abs((beam.damageLevel || 0) - newDamage) > 0.01 || beam.isBroken !== isBroken) {
                updateBeamDamage(beamId, newDamage, isBroken);
                
                // También actualizar propiedades del beam
                updateBeamProperties(beamId, { currentStress: stress });
              }
            }
          }
        });

        // Agregar resultado de simulación
        addSimulationResult(simulationResult);
      }
    }, 30); // Actualizar cada 30ms para colapso más rápido

    return () => clearInterval(interval);
  }, [state.isSimulating, state.structuralModel, state.earthquakeConfig, updateBeamDamage, addSimulationResult, updateBeamProperties]);

  // Efecto para manejar la eliminación de elementos con la tecla Delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selectedElement && !state.isSimulating) {
          // Solo permitir eliminación si no está simulando
          deleteElement(state.selectedElement.id);
          console.log(`🗑️ Elemento eliminado: ${state.selectedElement.id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElement, state.isSimulating, deleteElement]);

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
    selectedElement: state.selectedElement,
    
    // Funciones
    updateSimulationConfig,
    updateEarthquakeConfig,
    updateUIConfig,
    startSimulation,
    stopSimulation,
    analyzeStructure,
    updateNodePosition,
    addSimulationResult,
    updateBeamDamage,
    resetStructuralDamage,
    selectElement,
    updateBeamProperties,
    updateNodePositionWithAdaptation,
    deleteElement,
    collapseSimulation: state.collapseSimulation,
    initializeCollapseSimulation,
    updateCollapseSimulation,
    resetCollapseSimulation
  };
}; 