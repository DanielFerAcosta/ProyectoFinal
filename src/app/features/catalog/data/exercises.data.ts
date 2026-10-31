import { Exercise } from '../models/exercise.model';

export const EXERCISES: readonly Exercise[] = [
  {
    id: 'bodyweight-squat',
    name: 'Sentadilla sin carga',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    description:
      'Ejemplo del catálogo para explorar la categoría de tren inferior.',
  },
  {
    id: 'push-up',
    name: 'Flexiones',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    level: 'intermediate',
    description:
      'Ejemplo del catálogo dentro de los ejercicios sin equipamiento.',
  },
  {
    id: 'dumbbell-row',
    name: 'Remo con mancuerna',
    muscleGroup: 'back',
    equipment: 'dumbbells',
    level: 'beginner',
    description:
      'Ejemplo del catálogo que requiere disponer de una mancuerna.',
  },
  {
    id: 'dumbbell-curl',
    name: 'Curl con mancuernas',
    muscleGroup: 'arms',
    equipment: 'dumbbells',
    level: 'beginner',
    description:
      'Ejemplo del catálogo dentro de la categoría de brazos.',
  },
  {
    id: 'lat-pulldown',
    name: 'Jalón al pecho',
    muscleGroup: 'back',
    equipment: 'machine',
    level: 'beginner',
    description:
      'Ejemplo del catálogo que utiliza una máquina de poleas.',
  },
  {
    id: 'leg-press',
    name: 'Prensa de piernas',
    muscleGroup: 'legs',
    equipment: 'machine',
    level: 'beginner',
    description:
      'Ejemplo del catálogo que requiere una máquina de prensa.',
  },
];