import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  CreateRoutineInput,
  Routine,
} from '../models/routine.model';

@Injectable({
  providedIn: 'root',
})
export class RoutineService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  async getMyRoutines(): Promise<Routine[]> {
    await this.auth.ready;

    const currentUser = this.auth.user();

    if (!currentUser) {
      throw new Error(
        'Debes iniciar sesión para consultar tus rutinas.',
      );
    }

    const { data, error } = await this.supabase
      .from('routines')
      .select(`
        id,
        user_id,
        name,
        created_at,
        exercises:routine_exercises (
          id,
          exercise_id,
          position,
          sets,
          repetitions
        )
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((routine) => ({
      id: routine.id,
      user_id: routine.user_id,
      name: routine.name,
      created_at: routine.created_at,
      exercises: [...routine.exercises].sort(
        (first, second) => first.position - second.position,
      ),
    }));
  }

  async createRoutine(input: CreateRoutineInput): Promise<string> {
    await this.auth.ready;

    if (!this.auth.user()) {
      throw new Error(
        'Debes iniciar sesión para crear una rutina.',
      );
    }

    const name = input.name.trim();

    if (name.length === 0 || name.length > 80) {
      throw new Error(
        'El nombre debe tener entre 1 y 80 caracteres.',
      );
    }

    if (
      input.exercises.length === 0 ||
      input.exercises.length > 6
    ) {
      throw new Error(
        'Selecciona entre 1 y 6 ejercicios.',
      );
    }

    const exerciseIds = new Set(
      input.exercises.map((exercise) => exercise.exercise_id),
    );

    if (exerciseIds.size !== input.exercises.length) {
      throw new Error(
        'No puedes repetir un ejercicio en la misma rutina.',
      );
    }

    const exercises = input.exercises.map((exercise) => {
      if (
        !Number.isInteger(exercise.sets) ||
        exercise.sets < 1 ||
        exercise.sets > 20
      ) {
        throw new Error(
          'Las series deben ser enteras entre 1 y 20.',
        );
      }

      if (
        !Number.isInteger(exercise.repetitions) ||
        exercise.repetitions < 1 ||
        exercise.repetitions > 100
      ) {
        throw new Error(
          'Las repeticiones deben ser enteras entre 1 y 100.',
        );
      }

      return {
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        repetitions: exercise.repetitions,
      };
    });

    const { data, error } = await this.supabase.rpc(
      'create_routine',
      {
        p_name: name,
        p_exercises: exercises,
      },
    );

    if (error) {
      throw error;
    }

    if (typeof data !== 'string') {
      throw new Error(
        'El servidor no devolvió el identificador de la rutina.',
      );
    }

    return data;
  }
}