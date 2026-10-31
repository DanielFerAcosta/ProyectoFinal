export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'machine';

export type ExerciseLevel =
  | 'beginner'
  | 'intermediate';

export type MuscleGroup =
  | 'legs'
  | 'chest'
  | 'back'
  | 'arms';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  level: ExerciseLevel;
  description: string;
}