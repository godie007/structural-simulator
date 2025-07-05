import React, { useState, useEffect } from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Slider from '../atoms/Slider';
import { StructuralBeam, StructuralNode } from '../types';
import { MATERIALS } from '../constants/materials';

interface ElementEditorProps {
  selectedElement: StructuralBeam | null;
  nodes: StructuralNode[];
  onUpdateElement: (elementId: string, updates: Partial<StructuralBeam>) => void;
  onUpdateNode: (nodeId: string, position: [number, number, number]) => void;
  onClose: () => void;
}

const ElementEditor: React.FC<ElementEditorProps> = ({
  selectedElement,
  nodes,
  onUpdateElement,
  onUpdateNode,
  onClose
}) => {
  const [localElement, setLocalElement] = useState<StructuralBeam | null>(null);
  const [nodeA, setNodeA] = useState<StructuralNode | null>(null);
  const [nodeB, setNodeB] = useState<StructuralNode | null>(null);

  useEffect(() => {
    if (selectedElement) {
      setLocalElement({ ...selectedElement });
      const nodeA = nodes.find(n => n.id === selectedElement.nodeIds[0]);
      const nodeB = nodes.find(n => n.id === selectedElement.nodeIds[1]);
      setNodeA(nodeA || null);
      setNodeB(nodeB || null);
    }
  }, [selectedElement, nodes]);

  if (!selectedElement || !localElement || !nodeA || !nodeB) {
    return null;
  }


  const currentLength = Math.sqrt(
    Math.pow(nodeB.position[0] - nodeA.position[0], 2) +
    Math.pow(nodeB.position[1] - nodeA.position[1], 2) +
    Math.pow(nodeB.position[2] - nodeA.position[2], 2)
  );

  const handleApplyChanges = () => {
    if (localElement) {
      onUpdateElement(selectedElement.id, localElement);
    }
  };

  const handleReset = () => {
    setLocalElement({ ...selectedElement });
  };

  const updateNodePosition = (nodeId: string, axis: 'x' | 'y' | 'z', value: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newPosition = [...node.position] as [number, number, number];
    newPosition[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] = value;
    onUpdateNode(nodeId, newPosition);
  };

  return (
    <div className="fixed top-4 right-4 w-80 z-50">
      <Card title={`Editor: ${selectedElement.id}`} variant="elevated">
        <div className="space-y-4">
          {/* Información del elemento */}
          <div className="bg-gray-700 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Información</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Tipo: {selectedElement.profileType}</div>
              <div>Material: {selectedElement.material}</div>
              <div>Longitud actual: {currentLength.toFixed(2)} m</div>
              <div>Esfuerzo actual: {selectedElement.currentStress?.toFixed(1) || '0'} MPa</div>
              <div>Daño: {((selectedElement.damageLevel || 0) * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Dimensiones del elemento */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Dimensiones</h4>
            <div className="space-y-3">
              <Slider
                label="Ancho"
                value={localElement.width}
                onChange={(value) => setLocalElement({ ...localElement, width: value })}
                min={0.05}
                max={1.0}
                step={0.01}
                unit=" m"
              />
              <Slider
                label="Alto"
                value={localElement.height}
                onChange={(value) => setLocalElement({ ...localElement, height: value })}
                min={10}
                max={500}
                step={1}
                unit=" mm"
              />
              {localElement.thickness && (
                <Slider
                  label="Espesor"
                  value={localElement.thickness}
                  onChange={(value) => setLocalElement({ ...localElement, thickness: value })}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  unit=" m"
                />
              )}
            </div>
          </div>

          {/* Propiedades del material */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Propiedades</h4>
            <div className="space-y-3">
              <Slider
                label="Módulo Elástico"
                value={localElement.elasticModulus}
                onChange={(value) => setLocalElement({ ...localElement, elasticModulus: value })}
                min={10000}
                max={300000}
                step={1000}
                unit=" MPa"
              />
              <Slider
                label="Resistencia de Fluencia"
                value={localElement.yieldStrength}
                onChange={(value) => setLocalElement({ ...localElement, yieldStrength: value })}
                min={100}
                max={500}
                step={1}
                unit=" MPa"
              />
              <Slider
                label="Masa"
                value={localElement.mass}
                onChange={(value) => setLocalElement({ ...localElement, mass: value })}
                min={1}
                max={100}
                step={0.1}
                unit=" kg/m"
              />
            </div>
          </div>

          {/* Posición del nodo A */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Nodo A ({nodeA.id})</h4>
            <div className="space-y-3">
              <Slider
                label="Posición X"
                value={nodeA.position[0]}
                onChange={(value) => updateNodePosition(nodeA.id, 'x', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m"
              />
              <Slider
                label="Posición Y"
                value={nodeA.position[1]}
                onChange={(value) => updateNodePosition(nodeA.id, 'y', value)}
                min={-10}
                max={20}
                step={0.1}
                unit=" m"
              />
              <Slider
                label="Posición Z"
                value={nodeA.position[2]}
                onChange={(value) => updateNodePosition(nodeA.id, 'z', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m"
              />
            </div>
          </div>

          {/* Posición del nodo B */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Nodo B ({nodeB.id})</h4>
            <div className="space-y-3">
              <Slider
                label="Posición X"
                value={nodeB.position[0]}
                onChange={(value) => updateNodePosition(nodeB.id, 'x', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m"
              />
              <Slider
                label="Posición Y"
                value={nodeB.position[1]}
                onChange={(value) => updateNodePosition(nodeB.id, 'y', value)}
                min={-10}
                max={20}
                step={0.1}
                unit=" m"
              />
              <Slider
                label="Posición Z"
                value={nodeB.position[2]}
                onChange={(value) => updateNodePosition(nodeB.id, 'z', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2">
            <Button
              onClick={handleApplyChanges}
              variant="success"
              size="sm"
              className="flex-1"
            >
              ✅ Aplicar
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              🔄 Resetear
            </Button>
            <Button
              onClick={onClose}
              variant="danger"
              size="sm"
              className="flex-1"
            >
              ❌ Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ElementEditor; 