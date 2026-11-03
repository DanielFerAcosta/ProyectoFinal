import { Injectable, inject } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TrainingSession } from '../models/training-session.model';

@Injectable({
  providedIn: 'root',
})
export class TrainingSessionService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  private channelSequence = 0;

  async startOrResume(
    routineId: string,
  ): Promise<TrainingSession> {
    await this.requireUserId();

    if (!routineId.trim()) {
      throw new Error(
        'Selecciona una rutina válida.',
      );
    }

    const { data, error } = await this.supabase.rpc(
      'start_training_session',
      {
        p_routine_id: routineId,
      },
    );

    if (error) {
      throw error;
    }

    if (typeof data !== 'string') {
      throw new Error(
        'El servidor no devolvió el identificador de la sesión.',
      );
    }

    return this.getSession(data);
  }

  async getSession(
    sessionId: string,
  ): Promise<TrainingSession> {
    const userId = await this.requireUserId();

    const { data, error } = await this.supabase
      .from('training_sessions')
      .select(`
        id,
        user_id,
        routine_id,
        routine_name,
        exercises,
        completed_count,
        started_at,
        updated_at,
        finished_at
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .returns<TrainingSession[]>()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        'La sesión no está disponible para esta cuenta.',
      );
    }

    return data;
  }

  async completeNextExercise(
    sessionId: string,
    expectedCompleted: number,
  ): Promise<TrainingSession> {
    await this.requireUserId();

    if (
      !Number.isInteger(expectedCompleted) ||
      expectedCompleted < 0
    ) {
      throw new Error(
        'El progreso esperado no es válido.',
      );
    }

    const { error } = await this.supabase.rpc(
      'advance_training_session',
      {
        p_session_id: sessionId,
        p_expected_completed: expectedCompleted,
      },
    );

    if (error) {
      throw error;
    }

    return this.getSession(sessionId);
  }

  async getHistory(): Promise<TrainingSession[]> {
    const userId = await this.requireUserId();

    const { data, error } = await this.supabase
      .from('training_sessions')
      .select(`
        id,
        user_id,
        routine_id,
        routine_name,
        exercises,
        completed_count,
        started_at,
        updated_at,
        finished_at
      `)
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(20)
      .returns<TrainingSession[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  watchSession(
    sessionId: string,
    onChange: () => void,
    onStatus: (status: string) => void,
  ): RealtimeChannel {
    if (!this.auth.user()) {
      throw new Error(
        'Debes iniciar sesión para sincronizar el entrenamiento.',
      );
    }

    this.channelSequence += 1;

    const channelName =
      `training-session:${sessionId}:${this.channelSequence}`;

    return this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'training_sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          onChange();
        },
      )
      .subscribe((status, error) => {
        if (error) {
          console.error(
            'Error de sincronización del entrenamiento:',
            error,
          );
        }

        onStatus(status);
      });
  }

  async stopWatching(
    channel: RealtimeChannel,
  ): Promise<void> {
    await this.supabase.removeChannel(channel);
  }

  private async requireUserId(): Promise<string> {
    await this.auth.ready;

    const user = this.auth.user();

    if (!user) {
      throw new Error(
        'Debes iniciar sesión para consultar o guardar un entrenamiento.',
      );
    }

    return user.id;
  }
}