import React from 'react';
import Card from '../atoms/Card';
import { StructuralAnalysis, SimulationResult } from '../types';

interface AnalysisPanelProps {
  analysis: StructuralAnalysis | null;
  simulationResults: SimulationResult[];
  isLoading: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  simulationResults,
  isLoading
}) => {
  const getSafetyColor = (safetyFactor: number) => {
    if (safetyFactor >= 2.0) return 'text-green-400';
    if (safetyFactor >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };



  if (isLoading) {
    return (
      <Card title="Análisis Estructural" variant="elevated">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Analizando estructura...</span>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card title="Análisis Estructural" variant="elevated">
        <div className="text-center py-8 text-gray-400">
          Ejecuta un análisis para ver los resultados
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card title="Resultados del Análisis" variant="elevated">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Desplazamiento Máximo</div>
              <div className="text-lg font-semibold text-white">
                {analysis.maxDisplacement.toFixed(3)} mm
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Esfuerzo Máximo</div>
              <div className="text-lg font-semibold text-white">
                {analysis.maxStress.toFixed(1)} MPa
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400">Factor de Seguridad</div>
            <div className={`text-lg font-semibold ${getSafetyColor(analysis.safetyFactor)}`}>
              {analysis.safetyFactor.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {analysis.criticalElements.length > 0 && (
        <Card title="Elementos Críticos" variant="elevated">
          <div className="space-y-2">
            {analysis.criticalElements.map((element, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-2">
                <span className="text-sm text-gray-300">{element}</span>
                <span className="text-xs text-red-400">Crítico</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {analysis.recommendations.length > 0 && (
        <Card title="Recomendaciones" variant="elevated">
          <div className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">{recommendation}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {simulationResults.length > 0 && (
        <Card title="Historial de Simulaciones" variant="elevated">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {simulationResults.slice(-5).reverse().map((result, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs ${getSafetyColor(result.analysis.safetyFactor)}`}>
                    FS: {result.analysis.safetyFactor.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Desplazamiento: {result.analysis.maxDisplacement.toFixed(2)} mm
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalysisPanel; 