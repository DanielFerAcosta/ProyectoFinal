import { EXERCISES } from './exercises.data';
import { ExerciseGraph } from '../structures/exercise-graph';

export interface ExerciseConnection {
  firstId: string;
  secondId: string;
}

export const EXERCISE_CONNECTIONS:
  readonly ExerciseConnection[] = [
    {
      firstId: 'bodyweight-squat',
      secondId: 'leg-press',
    },
    {
      firstId: 'dumbbell-row',
      secondId: 'lat-pulldown',
    },
  ];

export function createExerciseGraph(): ExerciseGraph {
  const graph = new ExerciseGraph();

  for (const exercise of EXERCISES) {
    graph.addVertex(exercise.id);
  }

  for (const connection of EXERCISE_CONNECTIONS) {
    graph.addEdge(
      connection.firstId,
      connection.secondId,
    );
  }

  return graph;
}