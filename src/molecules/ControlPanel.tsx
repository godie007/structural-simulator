import React from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Slider from '../atoms/Slider';
import { EarthquakeConfig, SimulationConfig, StructuralBeam } from '../types';

interface ControlPanelProps {
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
  onEarthquakeConfigChange: (config: EarthquakeConfig) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onAnalyzeStructure: () => void;
  onResetDamage?: () => void;
  onDeselectElement?: () => void;
  isSimulating: boolean;
  isAnalyzing: boolean;
  hasSelectedElement?: boolean;
  selectedElement?: StructuralBeam | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationConfig,
  earthquakeConfig,
  onSimulationConfigChange,
  onEarthquakeConfigChange,
  onStartSimulation,
  onStopSimulation,
  onAnalyzeStructure,
  onResetDamage,
  onDeselectElement,
  isSimulating,
  isAnalyzing,
  hasSelectedElement,
  selectedElement
}) => {
  const handleGravityChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newGravity = [...simulationConfig.gravity] as [number, number, number];
    newGravity[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] = value;
    onSimulationConfigChange({
      ...simulationConfig,
      gravity: newGravity
    });
  };

  return (
    <div className="space-y-4">
      <Card title="Configuración de Simulación" variant="elevated">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Gravedad</h4>
            <div className="space-y-3">
              <Slider
                label="Eje X"
                value={simulationConfig.gravity[0]}
                onChange={(value) => handleGravityChange('x', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m/s²"
              />
              <Slider
                label="Eje Y"
                value={simulationConfig.gravity[1]}
                onChange={(value) => handleGravityChange('y', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m/s²"
              />
              <Slider
                label="Eje Z"
                value={simulationConfig.gravity[2]}
                onChange={(value) => handleGravityChange('z', value)}
                min={-20}
                max={20}
                step={0.1}
                unit=" m/s²"
              />
            </div>
          </div>
          
          <Slider
            label="Paso de Tiempo"
            value={simulationConfig.timeStep}
            onChange={(value) => onSimulationConfigChange({
              ...simulationConfig,
              timeStep: value
            })}
            min={0.001}
            max={0.1}
            step={0.001}
            unit=" s"
          />
          
          <Slider
            label="Iteraciones"
            value={simulationConfig.iterations}
            onChange={(value) => onSimulationConfigChange({
              ...simulationConfig,
              iterations: Math.round(value)
            })}
            min={1}
            max={20}
            step={1}
          />
          
          <Slider
            label="Amortiguación"
            value={simulationConfig.damping}
            onChange={(value) => onSimulationConfigChange({
              ...simulationConfig,
              damping: value
            })}
            min={0}
            max={1}
            step={0.01}
          />
        </div>
      </Card>

      <Card title="Configuración de Terremoto" variant="elevated">
        <div className="space-y-4">
          <Slider
            label="Intensidad"
            value={earthquakeConfig.intensity}
            onChange={(value) => onEarthquakeConfigChange({
              ...earthquakeConfig,
              intensity: value
            })}
            min={0}
            max={12}
            step={0.1}
            unit=" Richter"
          />
          
          <Slider
            label="Frecuencia"
            value={earthquakeConfig.frequency}
            onChange={(value) => onEarthquakeConfigChange({
              ...earthquakeConfig,
              frequency: value
            })}
            min={0.1}
            max={50}
            step={0.1}
            unit=" Hz"
          />
          
          <Slider
            label="Duración"
            value={earthquakeConfig.duration}
            onChange={(value) => onEarthquakeConfigChange({
              ...earthquakeConfig,
              duration: value
            })}
            min={1}
            max={60}
            step={1}
            unit=" s"
          />
          
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Tipo de Terremoto
            </label>
            <select
              value={earthquakeConfig.type}
              onChange={(e) => onEarthquakeConfigChange({
                ...earthquakeConfig,
                type: e.target.value as 'horizontal' | 'vertical' | 'rotational'
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="rotational">Rotacional</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Controles" variant="elevated">
        <div className="space-y-3">
          <Button
            onClick={isSimulating ? onStopSimulation : onStartSimulation}
            variant={isSimulating ? 'danger' : 'success'}
            fullWidth
            disabled={isAnalyzing}
          >
            {isSimulating ? 'Detener Simulación' : 'Iniciar Simulación'}
          </Button>
          
          <Button
            onClick={onAnalyzeStructure}
            variant="primary"
            fullWidth
            disabled={isSimulating || isAnalyzing}
          >
            {isAnalyzing ? 'Analizando...' : 'Analizar Estructura'}
          </Button>
          
          {onResetDamage && (
            <Button
              onClick={onResetDamage}
              variant="secondary"
              fullWidth
              disabled={isSimulating}
            >
              🔧 Resetear Daño Estructural
            </Button>
          )}
          
          {hasSelectedElement && onDeselectElement && (
            <Button
              onClick={onDeselectElement}
              variant="secondary"
              fullWidth
              disabled={isSimulating}
            >
              🖱️ Deseleccionar Elemento
            </Button>
          )}
        </div>
      </Card>

      {selectedElement && (
        <Card title="Elemento Seleccionado" variant="elevated">
          <div className="space-y-3">
            <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-200 mb-2">
                📍 {selectedElement.id}
              </h4>
              <div className="text-xs text-gray-300 space-y-1">
                <p>Tipo: {selectedElement.profileType}</p>
                <p>Material: {selectedElement.material}</p>
                <p>Longitud: {selectedElement.length.toFixed(2)} m</p>
                {selectedElement.damageLevel !== undefined && (
                  <p>Daño: {(selectedElement.damageLevel * 100).toFixed(1)}%</p>
                )}
                {selectedElement.currentStress !== undefined && (
                  <p>Esfuerzo: {selectedElement.currentStress.toFixed(1)} MPa</p>
                )}
              </div>
            </div>
            
            {!isSimulating && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
                <p className="text-xs text-red-200 mb-2">
                  🗑️ Para eliminar este elemento:
                </p>
                <p className="text-xs text-gray-300">
                  Presiona <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-white">Delete</kbd> o <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-white">Backspace</kbd>
                </p>
                <p className="text-xs text-yellow-300 mt-2">
                  ⚠️ Esto afectará la distribución de cargas y puntos críticos durante el terremoto.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card title="Pruebas Rápidas de Daño" variant="elevated">
        <div className="space-y-3">
          <Button
            onClick={() => onEarthquakeConfigChange({
              ...earthquakeConfig,
              intensity: 4.0,
              frequency: 8,
              duration: 8
            })}
            variant="warning"
            fullWidth
            disabled={isSimulating}
          >
            🌋 Terremoto Leve (4.0 Richter)
          </Button>
          
          <Button
            onClick={() => onEarthquakeConfigChange({
              ...earthquakeConfig,
              intensity: 7.0,
              frequency: 12,
              duration: 12
            })}
            variant="danger"
            fullWidth
            disabled={isSimulating}
          >
            🌋 Terremoto Moderado (7.0 Richter)
          </Button>
          
          <Button
            onClick={() => onEarthquakeConfigChange({
              ...earthquakeConfig,
              intensity: 9.0,
              frequency: 18,
              duration: 20
            })}
            variant="danger"
            fullWidth
            disabled={isSimulating}
          >
            🌋 Terremoto Severo (9.0 Richter)
          </Button>
          
          <Button
            onClick={() => onEarthquakeConfigChange({
              ...earthquakeConfig,
              intensity: 12.0,
              frequency: 25,
              duration: 30
            })}
            variant="danger"
            fullWidth
            disabled={isSimulating}
          >
            💥 Terremoto Catastrófico (12.0 Richter)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ControlPanel; 