import React from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Slider from '../atoms/Slider';
import { EarthquakeConfig, SimulationConfig } from '../types';

interface ControlPanelProps {
  simulationConfig: SimulationConfig;
  earthquakeConfig: EarthquakeConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
  onEarthquakeConfigChange: (config: EarthquakeConfig) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onAnalyzeStructure: () => void;
  isSimulating: boolean;
  isAnalyzing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationConfig,
  earthquakeConfig,
  onSimulationConfigChange,
  onEarthquakeConfigChange,
  onStartSimulation,
  onStopSimulation,
  onAnalyzeStructure,
  isSimulating,
  isAnalyzing
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
        </div>
      </Card>
    </div>
  );
};

export default ControlPanel; 