import React from 'react';
import ControlPanel from '../molecules/ControlPanel';
import AnalysisPanel from '../molecules/AnalysisPanel';
import ElementEditor from '../molecules/ElementEditor';
import StructuralScene from '../organisms/StructuralScene';
import { useStructuralSimulator } from '../hooks/useStructuralSimulator';
import Button from '../atoms/Button';

const SimulatorLayout: React.FC = () => {
  const {
    structuralModel,
    simulationConfig,
    earthquakeConfig,
    uiConfig,
    isSimulating,
    isAnalyzing,
    analysisResult,
    simulationResults,
    selectedElement,
    updateSimulationConfig,
    updateEarthquakeConfig,
    startSimulation,
    stopSimulation,
    analyzeStructure,
    resetStructuralDamage,
    selectElement,
    updateBeamProperties,
    updateNodePositionWithAdaptation,
    deleteElement,
    collapseSimulation
  } = useStructuralSimulator();

  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [activePanel, setActivePanel] = React.useState<'controls' | 'analysis'>('controls');

  if (!structuralModel) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-white">Cargando simulador...</span>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Panel lateral izquierdo */}
      <div className="absolute top-0 left-0 h-full w-[400px] bg-gray-800/90 backdrop-blur-sm border-r border-gray-700 z-10">
        <div className="h-full flex flex-col">
          {/* Header del panel */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Simulador Estructural 3D</h1>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setActivePanel('controls')}
                  variant={activePanel === 'controls' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  ⚙️ Controles
                </Button>
                <Button
                  onClick={() => setActivePanel('analysis')}
                  variant={activePanel === 'analysis' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  📊 Análisis
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido del panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'controls' ? (
              <ControlPanel
                simulationConfig={simulationConfig}
                earthquakeConfig={earthquakeConfig}
                onSimulationConfigChange={updateSimulationConfig}
                onEarthquakeConfigChange={updateEarthquakeConfig}
                onStartSimulation={startSimulation}
                onStopSimulation={stopSimulation}
                onAnalyzeStructure={analyzeStructure}
                onResetDamage={resetStructuralDamage}
                onDeselectElement={() => selectElement(null)}
                isSimulating={isSimulating}
                isAnalyzing={isAnalyzing}
                hasSelectedElement={!!selectedElement}
                selectedElement={selectedElement}
              />
            ) : (
              <AnalysisPanel
                analysis={analysisResult}
                simulationResults={simulationResults}
                isLoading={isAnalyzing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Escena 3D */}
      <div className="h-full w-full">
        <StructuralScene
          nodes={structuralModel.nodes}
          beams={structuralModel.beams}
          foundations={structuralModel.foundations}
          simulationConfig={simulationConfig}
          earthquakeConfig={earthquakeConfig}
          viewMode={uiConfig.viewMode}
          isSimulating={isSimulating}
          selectedElement={selectedElement}
          collapseSimulation={collapseSimulation}
          onNodePositionUpdate={updateNodePositionWithAdaptation}
          onElementSelect={selectElement}
        />
      </div>

      {/* Editor de elementos */}
      {selectedElement && (
        <ElementEditor
          selectedElement={selectedElement}
          nodes={structuralModel.nodes}
          onUpdateElement={updateBeamProperties}
          onUpdateNode={updateNodePositionWithAdaptation}
          onClose={() => selectElement(null)}
        />
      )}

      {/* Botón de ayuda */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={() => setIsHelpOpen(true)}
          variant="primary"
          size="sm"
          className="rounded-full p-2"
        >
          ❓
        </Button>
      </div>

      {/* Modal de ayuda */}
      {isHelpOpen && (
        <div 
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" 
          onClick={() => setIsHelpOpen(false)}
        >
          <div 
            className="bg-gray-800 p-8 rounded-lg max-w-3xl text-gray-300 border border-gray-700 shadow-2xl max-h-[80vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Simulador Estructural Avanzado</h2>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">🎮 Controles de Cámara</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Clic y arrastrar:</strong> Rotar la cámara alrededor de la estructura</li>
                  <li><strong>Rueda del ratón:</strong> Zoom in/out</li>
                  <li><strong>Clic derecho + arrastrar:</strong> Pan de la cámara</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">🏗️ Estructura Modelada</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Edificio de 2 pisos:</strong> 9 nodos estructurales principales</li>
                  <li><strong>Perfiles IPE:</strong> Vigas con geometría realista de acero</li>
                  <li><strong>Perfiles HEA:</strong> Columnas con secciones estándar</li>
                  <li><strong>Fundaciones:</strong> Dados de hormigón armado</li>
                  <li><strong>Materiales:</strong> Acero S235 y hormigón C25</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">⚡ Simulación de Terremotos</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Intensidad:</strong> 0-12 escala Richter</li>
                  <li><strong>Frecuencia:</strong> 0.1-50 Hz (frecuencia de vibración)</li>
                  <li><strong>Duración:</strong> 1-60 segundos</li>
                  <li><strong>Tipos:</strong> Horizontal, Vertical, Rotacional</li>
                  <li><strong>Física real:</strong> Gravedad, masa, restricciones</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">📊 Análisis Estructural</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Desplazamientos:</strong> Deformaciones máximas en mm</li>
                  <li><strong>Esfuerzos:</strong> Tensiones en MPa</li>
                  <li><strong>Factor de Seguridad:</strong> Ratio resistencia/carga</li>
                  <li><strong>Elementos Críticos:</strong> Identificación de puntos débiles</li>
                  <li><strong>Recomendaciones:</strong> Sugerencias de mejora</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">🎯 Funcionalidades Avanzadas</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Simulación en tiempo real:</strong> Física de partículas con React Three Cannon</li>
                  <li><strong>Perfiles realistas:</strong> Geometría exacta de perfiles IPE y HEA</li>
                  <li><strong>Materiales reales:</strong> Propiedades físicas de acero y hormigón</li>
                  <li><strong>Análisis automático:</strong> Cálculos estructurales con IA</li>
                  <li><strong>Historial:</strong> Seguimiento de simulaciones anteriores</li>
                </ul>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <Button 
                onClick={() => setIsHelpOpen(false)} 
                variant="primary" 
                fullWidth
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SimulatorLayout; 