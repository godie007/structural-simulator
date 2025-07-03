import { 
  StructuralModel, 
  StructuralAnalysis, 
  SimulationResult,
  StructuralBeam,
  StructuralNode,
  EarthquakeConfig 
} from '../types';
import { MATERIALS } from '../constants/materials';

export class StructuralAnalysisService {
  
  /**
   * Analiza la estructura y retorna resultados de análisis
   */
  static analyzeStructure(model: StructuralModel): StructuralAnalysis {
    const beams = model.beams;
    const nodes = model.nodes;
    
    // Calcular desplazamientos máximos (simulado)
    const maxDisplacement = this.calculateMaxDisplacement(beams, nodes);
    
    // Calcular esfuerzos máximos
    const maxStress = this.calculateMaxStress(beams);
    
    // Calcular factor de seguridad
    const safetyFactor = this.calculateSafetyFactor(beams, maxStress);
    
    // Identificar elementos críticos
    const criticalElements = this.identifyCriticalElements(beams, maxStress);
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(beams, safetyFactor, criticalElements);
    
    return {
      maxDisplacement,
      maxStress,
      safetyFactor,
      criticalElements,
      recommendations
    };
  }
  
  /**
   * Simula un terremoto y retorna resultados
   */
  static simulateEarthquake(
    model: StructuralModel, 
    earthquakeConfig: EarthquakeConfig
  ): SimulationResult {
    const timestamp = Date.now();
    
    // Simular posiciones de nodos durante el terremoto
    const nodePositions: Record<string, [number, number, number]> = {};
    model.nodes.forEach(node => {
      const basePosition = node.position;
      const intensity = earthquakeConfig.intensity;
      const frequency = earthquakeConfig.frequency;
      
      // Simular movimiento sísmico
      const displacementX = Math.sin(timestamp * frequency * 0.001) * intensity * 0.01;
      const displacementY = Math.cos(timestamp * frequency * 0.001) * intensity * 0.005;
      const displacementZ = Math.sin(timestamp * frequency * 0.001 * 1.5) * intensity * 0.01;
      
      nodePositions[node.id] = [
        basePosition[0] + displacementX,
        basePosition[1] + displacementY,
        basePosition[2] + displacementZ
      ];
    });
    
    // Calcular esfuerzos en vigas
    const beamStresses: Record<string, number> = {};
    model.beams.forEach(beam => {
      const baseStress = this.calculateBeamStress(beam, earthquakeConfig.intensity);
      beamStresses[beam.id] = baseStress;
    });
    
    // Calcular reacciones de fundación
    const foundationReactions: Record<string, [number, number, number]> = {};
    model.foundations.forEach(foundation => {
      foundationReactions[foundation.id] = [
        Math.random() * 100 + 50, // kN
        Math.random() * 100 + 50, // kN
        Math.random() * 200 + 100  // kN
      ];
    });
    
    // Realizar análisis
    const analysis = this.analyzeStructure(model);
    
    return {
      timestamp,
      nodePositions,
      beamStresses,
      foundationReactions,
      analysis
    };
  }
  
  /**
   * Calcula el desplazamiento máximo de la estructura
   */
  private static calculateMaxDisplacement(
    beams: StructuralBeam[], 
    _nodes: StructuralNode[]
  ): number {
    // Simulación de cálculo de desplazamientos
    // Desplazamiento basado en la longitud promedio y propiedades del material
    return Math.random() * 50 + 10; // 10-60 mm
  }
  
  /**
   * Calcula el esfuerzo máximo en la estructura
   */
  private static calculateMaxStress(beams: StructuralBeam[]): number {
    let maxStress = 0;
    
    beams.forEach(beam => {
      const material = MATERIALS[beam.material];
      if (material) {
        // Simular esfuerzo basado en propiedades del material
        const stress = Math.random() * material.yieldStrength * 0.8 + material.yieldStrength * 0.2;
        maxStress = Math.max(maxStress, stress);
      }
    });
    
    return maxStress;
  }
  
  /**
   * Calcula el factor de seguridad
   */
  private static calculateSafetyFactor(beams: StructuralBeam[], maxStress: number): number {
    let totalYieldStrength = 0;
    let totalAppliedStress = 0;
    
    beams.forEach(beam => {
      const material = MATERIALS[beam.material];
      if (material) {
        totalYieldStrength += material.yieldStrength * beam.length;
        totalAppliedStress += maxStress * beam.length;
      }
    });
    
    if (totalAppliedStress === 0) return 2.0; // Factor de seguridad por defecto
    
    return totalYieldStrength / totalAppliedStress;
  }
  
  /**
   * Identifica elementos críticos
   */
  private static identifyCriticalElements(beams: StructuralBeam[], maxStress: number): string[] {
    const criticalElements: string[] = [];
    
    beams.forEach(beam => {
      const material = MATERIALS[beam.material];
      if (material) {
        const stressRatio = maxStress / material.yieldStrength;
        if (stressRatio > 0.8) {
          criticalElements.push(beam.id);
        }
      }
    });
    
    return criticalElements.slice(0, 3); // Máximo 3 elementos críticos
  }
  
  /**
   * Genera recomendaciones de mejora
   */
  private static generateRecommendations(
    beams: StructuralBeam[], 
    safetyFactor: number, 
    criticalElements: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (safetyFactor < 1.5) {
      recommendations.push('El factor de seguridad es bajo. Considerar refuerzo estructural.');
    }
    
    if (criticalElements.length > 0) {
      recommendations.push(`Reforzar elementos críticos: ${criticalElements.join(', ')}`);
    }
    
    if (beams.length > 10) {
      recommendations.push('Evaluar la distribución de cargas en elementos principales');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('La estructura cumple con los criterios de seguridad básicos');
    }
    
    return recommendations;
  }
  
  /**
   * Calcula el esfuerzo en una viga específica
   */
  private static calculateBeamStress(beam: StructuralBeam, earthquakeIntensity: number): number {
    const material = MATERIALS[beam.material];
    if (!material) return 0;
    
    // Simular esfuerzo basado en intensidad del terremoto
    const baseStress = material.yieldStrength * 0.3;
    const earthquakeFactor = earthquakeIntensity / 12; // Normalizar a 0-1
    
    return baseStress + (material.yieldStrength * 0.5 * earthquakeFactor);
  }
  
  /**
   * Valida la estructura
   */
  static validateStructure(model: StructuralModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nodos
    if (model.nodes.length === 0) {
      errors.push('La estructura debe tener al menos un nodo');
    }
    
    // Validar vigas
    if (model.beams.length === 0) {
      errors.push('La estructura debe tener al menos una viga');
    }
    
    // Validar conexiones
    model.beams.forEach(beam => {
      const nodeA = model.nodes.find(n => n.id === beam.nodeIds[0]);
      const nodeB = model.nodes.find(n => n.id === beam.nodeIds[1]);
      
      if (!nodeA || !nodeB) {
        errors.push(`Viga ${beam.id} tiene nodos inválidos`);
      }
    });
    
    // Validar materiales
    model.beams.forEach(beam => {
      if (!MATERIALS[beam.material]) {
        errors.push(`Material no válido para viga ${beam.id}: ${beam.material}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 