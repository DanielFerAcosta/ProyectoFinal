export interface RoutineExercise {
  id: string;
  exercise_id: string;
  position: number;
  sets: number;
  repetitions: number;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  exercises: RoutineExercise[];
}

export interface CreateRoutineExercise {
  exercise_id: string;
  sets: number;
  repetitions: number;
}

export interface CreateRoutineInput {
  name: string;
  exercises: CreateRoutineExercise[];
}