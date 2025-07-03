import { MaterialProperties } from '../types';

export const MATERIALS: Record<string, MaterialProperties> = {
  steel_S235: {
    name: 'Acero S235',
    density: 7850, // kg/m³
    elasticModulus: 210000, // MPa
    yieldStrength: 235, // MPa
    ultimateStrength: 360, // MPa
    poissonRatio: 0.3
  },
  steel_S355: {
    name: 'Acero S355',
    density: 7850,
    elasticModulus: 210000,
    yieldStrength: 355,
    ultimateStrength: 470,
    poissonRatio: 0.3
  },
  concrete_C25: {
    name: 'Hormigón C25',
    density: 2400,
    elasticModulus: 30000,
    yieldStrength: 25,
    ultimateStrength: 30,
    poissonRatio: 0.2
  },
  concrete_C30: {
    name: 'Hormigón C30',
    density: 2400,
    elasticModulus: 33000,
    yieldStrength: 30,
    ultimateStrength: 37,
    poissonRatio: 0.2
  },
  aluminum_6061: {
    name: 'Aluminio 6061',
    density: 2700,
    elasticModulus: 69000,
    yieldStrength: 240,
    ultimateStrength: 310,
    poissonRatio: 0.33
  }
};

export const PROFILE_DIMENSIONS = {
  IPE: {
    'IPE80': { height: 80, width: 46, thickness: 3.8, mass: 6.0 },
    'IPE100': { height: 100, width: 55, thickness: 4.1, mass: 8.1 },
    'IPE120': { height: 120, width: 64, thickness: 4.4, mass: 10.4 },
    'IPE140': { height: 140, width: 73, thickness: 4.7, mass: 12.9 },
    'IPE160': { height: 160, width: 82, thickness: 5.0, mass: 15.8 },
    'IPE180': { height: 180, width: 91, thickness: 5.3, mass: 18.8 },
    'IPE200': { height: 200, width: 100, thickness: 5.6, mass: 22.4 },
    'IPE220': { height: 220, width: 110, thickness: 5.9, mass: 26.2 },
    'IPE240': { height: 240, width: 120, thickness: 6.2, mass: 30.7 },
    'IPE270': { height: 270, width: 135, thickness: 6.6, mass: 36.1 },
    'IPE300': { height: 300, width: 150, thickness: 7.1, mass: 42.2 },
    'IPE330': { height: 330, width: 160, thickness: 7.5, mass: 49.1 },
    'IPE360': { height: 360, width: 170, thickness: 8.0, mass: 57.1 },
    'IPE400': { height: 400, width: 180, thickness: 8.6, mass: 66.3 },
    'IPE450': { height: 450, width: 190, thickness: 9.4, mass: 77.6 },
    'IPE500': { height: 500, width: 200, thickness: 10.2, mass: 90.7 },
    'IPE550': { height: 550, width: 210, thickness: 11.1, mass: 105.0 },
    'IPE600': { height: 600, width: 220, thickness: 12.0, mass: 122.0 }
  },
  HEA: {
    'HEA100': { height: 96, width: 100, thickness: 5.0, mass: 16.7 },
    'HEA120': { height: 114, width: 120, thickness: 5.0, mass: 19.9 },
    'HEA140': { height: 133, width: 140, thickness: 5.5, mass: 24.7 },
    'HEA160': { height: 152, width: 160, thickness: 6.0, mass: 30.4 },
    'HEA180': { height: 171, width: 180, thickness: 6.0, mass: 35.5 },
    'HEA200': { height: 190, width: 200, thickness: 6.5, mass: 42.3 },
    'HEA220': { height: 210, width: 220, thickness: 7.0, mass: 50.5 },
    'HEA240': { height: 230, width: 240, thickness: 7.5, mass: 60.3 },
    'HEA260': { height: 250, width: 260, thickness: 7.5, mass: 68.2 },
    'HEA280': { height: 270, width: 280, thickness: 8.0, mass: 76.4 },
    'HEA300': { height: 290, width: 300, thickness: 8.5, mass: 88.3 },
    'HEA320': { height: 310, width: 300, thickness: 9.0, mass: 97.6 },
    'HEA340': { height: 330, width: 300, thickness: 9.5, mass: 105.0 },
    'HEA360': { height: 350, width: 300, thickness: 10.0, mass: 112.0 },
    'HEA400': { height: 390, width: 300, thickness: 11.0, mass: 125.0 },
    'HEA450': { height: 440, width: 300, thickness: 11.5, mass: 140.0 },
    'HEA500': { height: 490, width: 300, thickness: 12.0, mass: 155.0 },
    'HEA550': { height: 540, width: 300, thickness: 12.5, mass: 166.0 },
    'HEA600': { height: 590, width: 300, thickness: 13.0, mass: 178.0 },
    'HEA650': { height: 640, width: 300, thickness: 13.5, mass: 190.0 },
    'HEA700': { height: 690, width: 300, thickness: 14.5, mass: 204.0 },
    'HEA800': { height: 790, width: 300, thickness: 15.0, mass: 224.0 },
    'HEA900': { height: 890, width: 300, thickness: 16.0, mass: 252.0 },
    'HEA1000': { height: 990, width: 300, thickness: 16.5, mass: 272.0 }
  }
};

export const EARTHQUAKE_INTENSITIES = {
  very_light: { min: 0, max: 2, description: 'Muy ligero' },
  light: { min: 2, max: 4, description: 'Ligero' },
  moderate: { min: 4, max: 6, description: 'Moderado' },
  strong: { min: 6, max: 8, description: 'Fuerte' },
  very_strong: { min: 8, max: 10, description: 'Muy fuerte' },
  severe: { min: 10, max: 12, description: 'Severo' }
};

export const SOIL_TYPES = {
  rock: { resistance: 1000, description: 'Roca' },
  hard_soil: { resistance: 500, description: 'Suelo duro' },
  medium_soil: { resistance: 250, description: 'Suelo medio' },
  soft_soil: { resistance: 100, description: 'Suelo blando' },
  very_soft_soil: { resistance: 50, description: 'Suelo muy blando' }
}; 