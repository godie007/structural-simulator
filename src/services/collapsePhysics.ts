import { 
  StructuralBeam, 
  StructuralNode, 
  FallingElement, 
  CollisionEvent, 
  CollapseSimulation
} from '../types';

export class CollapsePhysicsService {
  private static readonly GRAVITY = [0, -15.0, 0] as [number, number, number]; // Gravedad más fuerte
  private static readonly AIR_RESISTANCE = 0.005; // Menos resistencia del aire
  private static readonly GROUND_FRICTION = 0.6; // Menos fricción para más rebote
  private static readonly GROUND_LEVEL = -2.25; // Nivel del suelo
  private static readonly TIME_STEP = 0.016; // 60 FPS

  /**
   * Inicializa la simulación de colapso
   */
  static initializeCollapseSimulation(
    beams: StructuralBeam[],
    nodes: StructuralNode[]
  ): CollapseSimulation {
    const fallingElements: FallingElement[] = [];
    const collisionEvents: CollisionEvent[] = [];

    // Identificar elementos rotos para iniciar la caída
    beams.forEach(beam => {
      if (beam.isBroken) {
        const nodeA = nodes.find(n => n.id === beam.nodeIds[0]);
        const nodeB = nodes.find(n => n.id === beam.nodeIds[1]);
        
        if (nodeA && nodeB) {
          // Calcular posición central del elemento
          const centerPosition: [number, number, number] = [
            (nodeA.position[0] + nodeB.position[0]) / 2,
            (nodeA.position[1] + nodeB.position[1]) / 2,
            (nodeA.position[2] + nodeB.position[2]) / 2
          ];

          fallingElements.push({
            elementId: beam.id,
            originalPosition: centerPosition,
            currentPosition: [...centerPosition],
            velocity: [
              (Math.random() - 0.5) * 4, // Velocidad inicial aleatoria en X
              Math.random() * 2,         // Velocidad inicial hacia arriba
              (Math.random() - 0.5) * 4  // Velocidad inicial aleatoria en Z
            ],
            mass: beam.mass * beam.length,
            isOnGround: false,
            impactEnergy: 0,
            hasCollided: false
          });
        }
      }
    });

    return {
      fallingElements,
      collisionEvents,
      groundLevel: this.GROUND_LEVEL,
      gravity: this.GRAVITY,
      airResistance: this.AIR_RESISTANCE,
      groundFriction: this.GROUND_FRICTION,
      isActive: fallingElements.length > 0,
      timestamp: Date.now()
    };
  }

  /**
   * Actualiza la simulación física de colapso
   */
  static updateCollapseSimulation(
    simulation: CollapseSimulation,
    beams: StructuralBeam[],
    nodes: StructuralNode[]
  ): CollapseSimulation {
    if (!simulation.isActive) return simulation;

    const updatedFallingElements: FallingElement[] = [];
    const newCollisionEvents: CollisionEvent[] = [...simulation.collisionEvents];

    // Actualizar cada elemento que está cayendo
    simulation.fallingElements.forEach(element => {
      const updatedElement = this.updateFallingElement(element, simulation);
      
      // Verificar colisiones con otros elementos
      const collisions = this.checkCollisions(updatedElement, simulation.fallingElements);
      newCollisionEvents.push(...collisions);

      // Verificar si el elemento rompe otros elementos al colisionar
      this.checkImpactDamage(updatedElement, beams, nodes);
      
      updatedFallingElements.push(updatedElement);
    });

    // Agregar nuevos elementos que se rompieron por impacto
    const newFallingElements = this.addNewFallingElements(newCollisionEvents, beams, nodes);
    updatedFallingElements.push(...newFallingElements);

    // Verificar si la simulación debe continuar
    const isActive = updatedFallingElements.some(element => 
      !element.isOnGround || element.velocity.some(v => Math.abs(v) > 0.1)
    );

    return {
      ...simulation,
      fallingElements: updatedFallingElements,
      collisionEvents: newCollisionEvents,
      isActive,
      timestamp: Date.now()
    };
  }

  /**
   * Actualiza la física de un elemento que está cayendo
   */
  private static updateFallingElement(
    element: FallingElement,
    simulation: CollapseSimulation
  ): FallingElement {
    const { currentPosition, velocity, mass } = element;
    const { gravity, airResistance, groundFriction, groundLevel } = simulation;

    // Aplicar gravedad
    const newVelocity: [number, number, number] = [
      velocity[0] + gravity[0] * this.TIME_STEP,
      velocity[1] + gravity[1] * this.TIME_STEP,
      velocity[2] + gravity[2] * this.TIME_STEP
    ];

    // Aplicar resistencia del aire
    const airResistanceForce = airResistance * mass;
    const speed = Math.sqrt(newVelocity[0] ** 2 + newVelocity[1] ** 2 + newVelocity[2] ** 2);
    
    if (speed > 0) {
      newVelocity[0] -= (newVelocity[0] / speed) * airResistanceForce * this.TIME_STEP;
      newVelocity[1] -= (newVelocity[1] / speed) * airResistanceForce * this.TIME_STEP;
      newVelocity[2] -= (newVelocity[2] / speed) * airResistanceForce * this.TIME_STEP;
    }

    // Actualizar posición
    const newPosition: [number, number, number] = [
      currentPosition[0] + newVelocity[0] * this.TIME_STEP,
      currentPosition[1] + newVelocity[1] * this.TIME_STEP,
      currentPosition[2] + newVelocity[2] * this.TIME_STEP
    ];

    // Verificar colisión con el suelo
    let isOnGround = element.isOnGround;
    let impactEnergy = element.impactEnergy;

    if (newPosition[1] <= groundLevel && !isOnGround) {
      isOnGround = true;
      newPosition[1] = groundLevel;
      
      // Calcular energía de impacto
      impactEnergy = 0.5 * mass * (newVelocity[1] ** 2);
      
      // Aplicar fricción del suelo
      newVelocity[0] *= (1 - groundFriction);
      newVelocity[2] *= (1 - groundFriction);
      newVelocity[1] = 0;
    }

    return {
      ...element,
      currentPosition: newPosition,
      velocity: newVelocity,
      isOnGround,
      impactEnergy
    };
  }

  /**
   * Verifica colisiones entre elementos que están cayendo
   */
  private static checkCollisions(
    element: FallingElement,
    allElements: FallingElement[]
  ): CollisionEvent[] {
    const collisions: CollisionEvent[] = [];
    const collisionRadius = 0.5; // Radio de colisión

    allElements.forEach(otherElement => {
      if (element.elementId === otherElement.elementId) return;

      const distance = Math.sqrt(
        (element.currentPosition[0] - otherElement.currentPosition[0]) ** 2 +
        (element.currentPosition[1] - otherElement.currentPosition[1]) ** 2 +
        (element.currentPosition[2] - otherElement.currentPosition[2]) ** 2
      );

      if (distance < collisionRadius && !element.hasCollided) {
        const impactForce = this.calculateImpactForce(element, otherElement);
        
        collisions.push({
          elementId: element.elementId,
          collidedWith: otherElement.elementId,
          impactForce,
          timestamp: Date.now(),
          position: element.currentPosition
        });
      }
    });

    return collisions;
  }

  /**
   * Calcula la fuerza de impacto entre dos elementos
   */
  private static calculateImpactForce(
    element1: FallingElement,
    element2: FallingElement
  ): number {
    const relativeVelocity = [
      element1.velocity[0] - element2.velocity[0],
      element1.velocity[1] - element2.velocity[1],
      element1.velocity[2] - element2.velocity[2]
    ];

    const relativeSpeed = Math.sqrt(
      relativeVelocity[0] ** 2 + relativeVelocity[1] ** 2 + relativeVelocity[2] ** 2
    );

    return 0.5 * (element1.mass + element2.mass) * (relativeSpeed ** 2);
  }

  /**
   * Verifica si el impacto rompe otros elementos
   */
  private static checkImpactDamage(
    element: FallingElement,
    beams: StructuralBeam[],
    nodes: StructuralNode[]
  ): StructuralBeam[] {
    const impactThreshold = 1000; // Joules
    const updatedBeams: StructuralBeam[] = [];

    if (element.impactEnergy > impactThreshold) {
      // Buscar elementos cercanos que puedan romperse
      beams.forEach(beam => {
        if (beam.isBroken) return;

        const nodeA = nodes.find(n => n.id === beam.nodeIds[0]);
        const nodeB = nodes.find(n => n.id === beam.nodeIds[1]);
        
        if (nodeA && nodeB) {
          const beamCenter: [number, number, number] = [
            (nodeA.position[0] + nodeB.position[0]) / 2,
            (nodeA.position[1] + nodeB.position[1]) / 2,
            (nodeA.position[2] + nodeB.position[2]) / 2
          ];

          const distance = Math.sqrt(
            (element.currentPosition[0] - beamCenter[0]) ** 2 +
            (element.currentPosition[1] - beamCenter[1]) ** 2 +
            (element.currentPosition[2] - beamCenter[2]) ** 2
          );

          // Si está cerca y el impacto es fuerte, romper el elemento
          if (distance < 3.0 && element.impactEnergy > impactThreshold * 2) {
            updatedBeams.push({
              ...beam,
              isBroken: true,
              damageLevel: 1.0
            });
          }
        }
      });
    }

    return updatedBeams;
  }

  /**
   * Agrega nuevos elementos que se rompieron por impacto
   */
  private static addNewFallingElements(
    collisionEvents: CollisionEvent[],
    beams: StructuralBeam[],
    nodes: StructuralNode[]
  ): FallingElement[] {
    const newFallingElements: FallingElement[] = [];

    collisionEvents.forEach(event => {
      const beam = beams.find(b => b.id === event.elementId);
      if (!beam || beam.isBroken) return;

      const nodeA = nodes.find(n => n.id === beam.nodeIds[0]);
      const nodeB = nodes.find(n => n.id === beam.nodeIds[1]);
      
      if (nodeA && nodeB) {
        const centerPosition: [number, number, number] = [
          (nodeA.position[0] + nodeB.position[0]) / 2,
          (nodeA.position[1] + nodeB.position[1]) / 2,
          (nodeA.position[2] + nodeB.position[2]) / 2
        ];

        newFallingElements.push({
          elementId: beam.id,
          originalPosition: centerPosition,
          currentPosition: [...centerPosition],
          velocity: [
            (Math.random() - 0.5) * 6, // Velocidad inicial explosiva en X
            Math.random() * 3,         // Velocidad inicial hacia arriba
            (Math.random() - 0.5) * 6  // Velocidad inicial explosiva en Z
          ],
          mass: beam.mass * beam.length,
          isOnGround: false,
          impactEnergy: 0,
          hasCollided: false
        });
      }
    });

    return newFallingElements;
  }

  /**
   * Obtiene las posiciones actualizadas de los elementos que están cayendo
   */
  static getUpdatedPositions(
    simulation: CollapseSimulation
  ): Map<string, [number, number, number]> {
    const positionMap = new Map<string, [number, number, number]>();

    simulation.fallingElements.forEach(element => {
      positionMap.set(element.elementId, element.currentPosition);
    });

    return positionMap;
  }

  /**
   * Verifica si un elemento está en el suelo
   */
  static isElementOnGround(elementId: string, simulation: CollapseSimulation): boolean {
    const element = simulation.fallingElements.find(e => e.elementId === elementId);
    return element?.isOnGround || false;
  }

  /**
   * Obtiene la energía de impacto de un elemento
   */
  static getElementImpactEnergy(elementId: string, simulation: CollapseSimulation): number {
    const element = simulation.fallingElements.find(e => e.elementId === elementId);
    return element?.impactEnergy || 0;
  }
} 