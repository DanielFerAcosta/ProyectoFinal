export interface TrainingSessionExercise {
  exercise_id: string;
  position: number;
  sets: number;
  repetitions: number;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine_name: string;
  exercises: TrainingSessionExercise[];
  completed_count: number;
  started_at: string;
  updated_at: string;
  finished_at: string | null;
}