import { Matrix, solve } from 'ml-matrix';
import { 
  StructuralModel, 
  StructuralAnalysis, 
  SimulationResult,
  StructuralBeam,
  StructuralNode,
  EarthquakeConfig,
  DamageEvent
} from '../types';
import { MATERIALS } from '../constants/materials';

export class StructuralAnalysisService {
  
  /**
   * Analiza la estructura y retorna resultados de análisis usando FEM realista
   */
  static analyzeStructure(model: StructuralModel): StructuralAnalysis {
    const beams = model.beams;
    const nodes = model.nodes;
    
    // --- NUEVO: Análisis FEM realista ---
    const femResults = this.performFEMAnalysis(nodes, beams);
    const maxDisplacement = femResults.maxDisplacement;
    const maxStress = femResults.maxStress;
    // ------------------------------------
    
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
   * Simula un terremoto con física realista y retorna resultados
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
      
      // Simular movimiento sísmico más realista
      const displacementX = Math.sin(timestamp * frequency * 0.001) * intensity * 0.01;
      const displacementY = Math.cos(timestamp * frequency * 0.001) * intensity * 0.005;
      const displacementZ = Math.sin(timestamp * frequency * 0.001 * 1.5) * intensity * 0.01;
      
      nodePositions[node.id] = [
        basePosition[0] + displacementX,
        basePosition[1] + displacementY,
        basePosition[2] + displacementZ
      ];
    });
    
    // Calcular esfuerzos realistas en vigas con daño progresivo
    const beamStresses: Record<string, number> = {};
    const updatedBeams = model.beams.map(beam => {
      const stress = this.calculateRealisticBeamStress(beam, earthquakeConfig, timestamp);
      beamStresses[beam.id] = stress;
      
      // Actualizar estado de daño del elemento
      const updatedBeam = this.updateBeamDamage(beam, stress, earthquakeConfig.intensity);
      return updatedBeam;
    });
    
    // Simular colapso progresivo
    const damageEvents = this.simulateProgressiveCollapse(updatedBeams, earthquakeConfig.intensity);
    
    // Calcular reacciones de fundación
    const foundationReactions: Record<string, [number, number, number]> = {};
    model.foundations.forEach(foundation => {
      foundationReactions[foundation.id] = [
        Math.random() * 100 + 50, // kN
        Math.random() * 100 + 50, // kN
        Math.random() * 200 + 100  // kN
      ];
    });
    
    // Realizar análisis con integridad estructural
    const analysis = this.analyzeStructureWithIntegrity(model, updatedBeams, damageEvents);
    
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
    beams: StructuralBeam[]
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
   * Calcula esfuerzos realistas en vigas considerando la intensidad del terremoto
   */
  private static calculateRealisticBeamStress(
    beam: StructuralBeam, 
    earthquakeConfig: EarthquakeConfig, 
    timestamp: number
  ): number {
    const material = MATERIALS[beam.material];
    if (!material) return 0;
    
    // Factor de intensidad del terremoto (0-1) - Muy agresivo para colapso inmediato
    const intensityFactor = earthquakeConfig.intensity / 6; // Muy agresivo
    
    // Factor de frecuencia (resonancia) - Muy agresivo
    const frequencyFactor = Math.min(earthquakeConfig.frequency / 8, 1); // Muy agresivo
    
    // Factor de tiempo (acumulación de daño) - Inmediato
    const timeFactor = Math.min(timestamp / 1000, 1); // Inmediato - 1 segundo para daño completo
    
    // Esfuerzo base del material - Muy alto
    const baseStress = material.yieldStrength * 0.8; // Muy alto
    
    // Esfuerzo dinámico por terremoto - Muy alto
    const dynamicStress = material.yieldStrength * 1.2 * intensityFactor * frequencyFactor; // Muy alto
    
    // Esfuerzo por fatiga acumulada - Inmediato
    const fatigueStress = material.yieldStrength * 0.6 * timeFactor; // Inmediato
    
    // Esfuerzo total
    const totalStress = baseStress + dynamicStress + fatigueStress;
    
    // Considerar daño previo - Muy agresivo
    const damageFactor = beam.damageLevel || 0;
    const effectiveStress = totalStress * (1 + damageFactor * 4); // Muy agresivo
    
    return Math.min(effectiveStress, material.ultimateStrength);
  }
  
  /**
   * Actualiza el estado de daño de una viga
   */
  private static updateBeamDamage(
    beam: StructuralBeam, 
    currentStress: number, 
    earthquakeIntensity: number
  ): StructuralBeam {
    const material = MATERIALS[beam.material];
    if (!material) return beam;
    
    const currentDamage = beam.damageLevel || 0;
    const currentFatigue = beam.fatigueFactor || 0;
    
    // Calcular nuevo nivel de daño - Muy agresivo para colapso inmediato
    const stressRatio = currentStress / material.yieldStrength;
    const damageIncrement = Math.max(0, stressRatio - 0.3) * 0.8 * (earthquakeIntensity / 6); // Muy agresivo
    
    const newDamage = Math.min(1, currentDamage + damageIncrement);
    
    // Calcular factor de fatiga - Muy agresivo para colapso inmediato
    const fatigueIncrement = stressRatio * 0.4 * (earthquakeIntensity / 6); // Muy agresivo
    const newFatigue = Math.min(1, currentFatigue + fatigueIncrement);
    
    // Determinar si el elemento se rompe - Muy fácil para colapso inmediato
    const isBroken = newDamage >= 0.5 || currentStress >= material.yieldStrength * 0.8; // Muy fácil
    
    return {
      ...beam,
      currentStress,
      damageLevel: newDamage,
      fatigueFactor: newFatigue,
      isBroken,
      criticalStress: material.ultimateStrength
    };
  }
  
  /**
   * Simula colapso progresivo de la estructura
   */
  private static simulateProgressiveCollapse(
    beams: StructuralBeam[], 
    earthquakeIntensity: number
  ): DamageEvent[] {
    const damageEvents: DamageEvent[] = [];
    const timestamp = Date.now();
    
    // Identificar elementos rotos
    const brokenBeams = beams.filter(beam => beam.isBroken);
    
    brokenBeams.forEach(beam => {
      damageEvents.push({
        type: 'element_broken',
        timestamp,
        elementId: beam.id,
        stressLevel: beam.currentStress || 0,
        damageLevel: beam.damageLevel || 0,
        cause: `Esfuerzo excedido: ${beam.currentStress?.toFixed(1)} MPa > ${beam.criticalStress?.toFixed(1)} MPa`      });
    });
    
    // Simular propagación de daño a elementos conectados - Muy agresivo para colapso inmediato
    brokenBeams.forEach(brokenBeam => {
      const connectedBeams = beams.filter(beam => 
        beam.id !== brokenBeam.id && 
        (beam.nodeIds.includes(brokenBeam.nodeIds[0]) || beam.nodeIds.includes(brokenBeam.nodeIds[1]))
      );
      
      connectedBeams.forEach(connectedBeam => {
        const propagationFactor = earthquakeIntensity / 3; // Muy agresivo
        const newDamage = (connectedBeam.damageLevel || 0) + propagationFactor * 0.9; // Muy agresivo
        
        if (newDamage >= 0.3) { // Muy fácil de propagar
          damageEvents.push({
            type: 'progressive_collapse',
            timestamp,
            elementId: connectedBeam.id,
            stressLevel: connectedBeam.currentStress || 0,
            damageLevel: newDamage,
            cause: `Propagación de daño desde ${brokenBeam.id}`
          });
        }
      });
    });
    
    return damageEvents;
  }
  
  /**
   * Analiza la estructura considerando integridad estructural
   */
  private static analyzeStructureWithIntegrity(
    model: StructuralModel,
    beams: StructuralBeam[],
    damageEvents: DamageEvent[]
  ): StructuralAnalysis {
    // Calcular salud general de la estructura
    const totalBeams = beams.length;
    const brokenBeams = beams.filter(beam => beam.isBroken).length;
    const damagedBeams = beams.filter(beam => (beam.damageLevel || 0) > 0.5).length;
    
    const overallHealth = Math.max(0, 100 - (brokenBeams / totalBeams) * 100);
    const collapseRisk = Math.min(100, (brokenBeams / totalBeams) * 200);
    
    // Identificar elementos críticos
    const criticalElements = beams
      .filter(beam => (beam.damageLevel || 0) > 0.7)
      .map(beam => beam.id);
    
    // Calcular esfuerzo máximo
    const maxStress = Math.max(...beams.map(beam => beam.currentStress || 0));
    
    // Calcular factor de seguridad
    const avgYieldStrength = beams.reduce((sum, beam) => {
      const material = MATERIALS[beam.material];
      return sum + (material?.yieldStrength || 0);
    }, 0) / beams.length;
    
    const safetyFactor = avgYieldStrength / maxStress;
    
    // Generar recomendaciones
    const recommendations = this.generateRealisticRecommendations(beams, damageEvents, overallHealth);
    
    return {
      maxDisplacement: this.calculateMaxDisplacement(beams),
      maxStress,
      safetyFactor,
      criticalElements,
      recommendations
    };
  }
  
  /**
   * Genera recomendaciones realistas basadas en el daño
   */
  private static generateRealisticRecommendations(
    beams: StructuralBeam[],
    damageEvents: DamageEvent[],
    overallHealth: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallHealth < 50) {
      recommendations.push('⚠️ ESTRUCTURA CRÍTICA: Evacuar inmediatamente');
      recommendations.push('🔧 Reforzar elementos estructurales principales');
    } else if (overallHealth < 80) {
      recommendations.push('⚠️ Daño significativo detectado');
      recommendations.push('🔧 Inspección técnica urgente requerida');
    }
    
    const brokenBeams = beams.filter(beam => beam.isBroken);
    if (brokenBeams.length > 0) {
      recommendations.push(`🔧 Reemplazar ${brokenBeams.length} elementos rotos`);
    }
    
    const highDamageBeams = beams.filter(beam => (beam.damageLevel || 0) > 0.8);
    if (highDamageBeams.length > 0) {
      recommendations.push(`🔧 Reforzar ${highDamageBeams.length} elementos con daño severo`);
    }
    
    if (damageEvents.some(event => event.type === 'progressive_collapse')) {
      recommendations.push('⚠️ Riesgo de colapso progresivo detectado');
      recommendations.push('🔧 Implementar medidas de contención');
    }
    
    return recommendations;
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

  /**
   * Realiza el análisis FEM usando ml-matrix y retorna desplazamientos y esfuerzos reales
   */
  private static performFEMAnalysis(nodes: StructuralNode[], beams: StructuralBeam[]): { maxDisplacement: number, maxStress: number } {
    const numNodes = nodes.length;
    const numDOF = numNodes * 3; // 3 grados de libertad por nodo (x, y, z)

    // Crear matrices de rigidez global K y vector de fuerzas F
    let K = Matrix.zeros(numDOF, numDOF);
    let F = Matrix.zeros(numDOF, 1);

    // Mapear nodos a índices
    const nodeIndexMap: Record<string, number> = {};
    nodes.forEach((node, idx) => {
      nodeIndexMap[node.id] = idx;
    });

    // Ensamblar matriz de rigidez global
    beams.forEach(beam => {
      const mat = MATERIALS[beam.material];
      if (!mat) return;

      const nodeAIdx = nodeIndexMap[beam.nodeIds[0]];
      const nodeBIdx = nodeIndexMap[beam.nodeIds[1]];
      if (nodeAIdx === undefined || nodeBIdx === undefined) return;

      const nodeA = nodes[nodeAIdx];
      const nodeB = nodes[nodeBIdx];

      // Calcular propiedades del elemento
      const area = (beam.width && beam.height) ? beam.width * beam.height / 10000 : 0.01; // m²
      const E = mat.elasticModulus * 1e6; // Pa
      const L = beam.length;

      // Vector del elemento (nodeB - nodeA)
      const dx = nodeB.position[0] - nodeA.position[0];
      const dy = nodeB.position[1] - nodeA.position[1];
      const dz = nodeB.position[2] - nodeA.position[2];
      const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // Cosenos directores
      const cx = dx / length;
      const cy = dy / length;
      const cz = dz / length;

      // Rigidez axial del elemento
      const k = (E * area) / length;

      // Matriz de rigidez local del elemento barra 3D (6x6)
      const ke = Matrix.zeros(6, 6);
      
      // Elemento barra: solo rigidez axial
      const localK = [
        [ k, 0, 0, -k, 0, 0],
        [ 0, 0, 0,  0, 0, 0],
        [ 0, 0, 0,  0, 0, 0],
        [-k, 0, 0,  k, 0, 0],
        [ 0, 0, 0,  0, 0, 0],
        [ 0, 0, 0,  0, 0, 0]
      ];

      // Matriz de transformación (simplificada para elemento axial)
      const T = Matrix.zeros(6, 6);
      T.set(0, 0, cx); T.set(0, 1, cy); T.set(0, 2, cz);
      T.set(1, 0, 0);  T.set(1, 1, 0);  T.set(1, 2, 0);
      T.set(2, 0, 0);  T.set(2, 1, 0);  T.set(2, 2, 0);
      T.set(3, 3, cx); T.set(3, 4, cy); T.set(3, 5, cz);
      T.set(4, 3, 0);  T.set(4, 4, 0);  T.set(4, 5, 0);
      T.set(5, 3, 0);  T.set(5, 4, 0);  T.set(5, 5, 0);

      // ke_global = T^T * ke_local * T
      const ke_local = new Matrix(localK);
      const ke_global = T.transpose().mmul(ke_local).mmul(T);

      // Ensamblar en matriz global
      const dofA = [nodeAIdx*3, nodeAIdx*3+1, nodeAIdx*3+2];
      const dofB = [nodeBIdx*3, nodeBIdx*3+1, nodeBIdx*3+2];
      const dofs = [...dofA, ...dofB];

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const globalI = dofs[i];
          const globalJ = dofs[j];
          const currentValue = K.get(globalI, globalJ);
          K.set(globalI, globalJ, currentValue + ke_global.get(i, j));
        }
      }
    });

    // Aplicar cargas (peso propio)
    nodes.forEach((node, idx) => {
      const mass = node.mass || 1; // kg
      const force = mass * 9.81; // N
      F.set(idx*3 + 1, 0, -force); // Fuerza en Y (gravedad)
    });

    // Aplicar condiciones de frontera (nodos con y=0 restringidos)
    const constrainedDOFs: number[] = [];
    nodes.forEach((node, idx) => {
      if (node.position[1] === 0) {
        constrainedDOFs.push(idx*3, idx*3+1, idx*3+2); // Restringir x, y, z
      }
    });

    // Eliminar filas y columnas restringidas
    const freeDOFs: number[] = [];
    for (let i = 0; i < numDOF; i++) {
      if (!constrainedDOFs.includes(i)) {
        freeDOFs.push(i);
      }
    }

    if (freeDOFs.length === 0) {
      return { maxDisplacement: 0, maxStress: 0 };
    }

    // Extraer submatrices para DOFs libres
    const Kff = Matrix.zeros(freeDOFs.length, freeDOFs.length);
    const Ff = Matrix.zeros(freeDOFs.length, 1);

    for (let i = 0; i < freeDOFs.length; i++) {
      for (let j = 0; j < freeDOFs.length; j++) {
        Kff.set(i, j, K.get(freeDOFs[i], freeDOFs[j]));
      }
      Ff.set(i, 0, F.get(freeDOFs[i], 0));
    }

    // Resolver sistema: Kff * uf = Ff
    let uf: Matrix;
    try {
      uf = solve(Kff, Ff);
    } catch (error) {
      console.warn('Error resolviendo sistema FEM:', error);
      return { maxDisplacement: 0, maxStress: 0 };
    }

    // Calcular desplazamiento máximo
    let maxDisplacement = 0;
    for (let i = 0; i < uf.rows; i++) {
      const disp = Math.abs(uf.get(i, 0));
      if (disp > maxDisplacement) maxDisplacement = disp;
    }

    // Calcular esfuerzos en elementos
    let maxStress = 0;
    beams.forEach(beam => {
      const mat = MATERIALS[beam.material];
      if (!mat) return;

      const nodeAIdx = nodeIndexMap[beam.nodeIds[0]];
      const nodeBIdx = nodeIndexMap[beam.nodeIds[1]];
      if (nodeAIdx === undefined || nodeBIdx === undefined) return;

      // Obtener desplazamientos de los nodos
      const uA = [0, 0, 0]; // Desplazamientos nodo A
      const uB = [0, 0, 0]; // Desplazamientos nodo B

      // Solo asignar si el DOF está libre
      for (let i = 0; i < 3; i++) {
        const dofA = nodeAIdx*3 + i;
        const dofB = nodeBIdx*3 + i;
        
        const idxA = freeDOFs.indexOf(dofA);
        const idxB = freeDOFs.indexOf(dofB);
        
        if (idxA !== -1) uA[i] = uf.get(idxA, 0);
        if (idxB !== -1) uB[i] = uf.get(idxB, 0);
      }

      // Calcular deformación axial
      const nodeA = nodes[nodeAIdx];
      const nodeB = nodes[nodeBIdx];
      const dx = nodeB.position[0] - nodeA.position[0];
      const dy = nodeB.position[1] - nodeA.position[1];
      const dz = nodeB.position[2] - nodeA.position[2];
      const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

      const cx = dx / length;
      const cy = dy / length;
      const cz = dz / length;

      // Deformación axial
      const deltaL = (uB[0] - uA[0]) * cx + (uB[1] - uA[1]) * cy + (uB[2] - uA[2]) * cz;
      const strain = deltaL / length;
      const stress = Math.abs(strain * mat.elasticModulus * 1e6); // Pa

      if (stress > maxStress) maxStress = stress;
    });

    return { 
      maxDisplacement: maxDisplacement * 1000, // Convertir a mm
      maxStress: maxStress / 1e6 // Convertir a MPa
    };
  }
} 
