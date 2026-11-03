import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, startWith } from 'rxjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { EXERCISES } from '../catalog/data/exercises.data';
import { Routine } from '../routines/models/routine.model';
import { RoutineService } from '../routines/services/routine.service';
import {
  TrainingSession,
  TrainingSessionExercise,
} from './models/training-session.model';
import { TrainingSessionService } from './services/training-session.service';
import { Queue } from './structures/queue';
import { MinHeap } from './structures/min-heap';

interface TrainingExercise extends TrainingSessionExercise {
  name: string;
}

@Component({
  selector: 'app-training-session',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    NavbarComponent,
  ],
  templateUrl: './training-session.component.html',
  styleUrl: './training-session.component.scss',
})
export class TrainingSessionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly routineService = inject(RoutineService);
  private readonly sessionService = inject(TrainingSessionService);

  private readonly exerciseQueue =
    new Queue<TrainingExercise>();

  private readonly exerciseNames = new Map(
    EXERCISES.map((exercise) => [
      exercise.id,
      exercise.name,
    ]),
  );

  private channel: RealtimeChannel | null = null;
  private requestVersion = 0;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly refreshing = signal(false);

  protected readonly errorMessage = signal('');
  protected readonly actionError = signal('');
  protected readonly syncMessage = signal('');
  protected readonly announcement = signal('');

  protected readonly routines = signal<Routine[]>([]);
  protected readonly history = signal<TrainingSession[]>([]);

  protected readonly session =
    signal<TrainingSession | null>(null);

  protected readonly currentExercise =
    signal<TrainingExercise | null>(null);

  protected readonly remainingExercises = signal(0);

  protected readonly totalExercises = computed(
    () => this.session()?.exercises.length ?? 0,
  );

  protected readonly completedExercises = computed(
    () => this.session()?.completed_count ?? 0,
  );

  protected readonly progressPercentage = computed(() => {
    const total = this.totalExercises();

    return total === 0
      ? 0
      : Math.round(
          (this.completedExercises() / total) * 100,
        );
  });

  protected readonly routinesByExerciseCount = computed(() => {
    const heap = new MinHeap<Routine>((first, second) => {
      const difference =
        first.exercises.length - second.exercises.length;

      if (difference !== 0) {
        return difference;
      }

      const nameDifference = first.name.localeCompare(
        second.name,
        'es',
      );

      return nameDifference !== 0
        ? nameDifference
        : first.id.localeCompare(second.id);
    });

    for (const routine of this.routines()) {
      if (routine.exercises.length > 0) {
        heap.insert(routine);
      }
    }

    const ordered: Routine[] = [];

    while (!heap.isEmpty()) {
      const routine = heap.extractMin();

      if (routine) {
        ordered.push(routine);
      }
    }

    return ordered;
  });

  protected readonly shortestRoutine = computed(
    () => this.routinesByExerciseCount()[0] ?? null,
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.requestVersion += 1;
      this.disconnectRealtime();
    });
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.loadPage();
      });
  }

  protected retry(): void {
    void this.loadPage();
  }

  protected async refreshProgress(): Promise<void> {
    const current = this.session();

    if (
      !current ||
      this.saving() ||
      this.refreshing() ||
      this.loading()
    ) {
      return;
    }

    const version = this.requestVersion;

    this.refreshing.set(true);
    this.actionError.set('');

    try {
      const updated = await this.sessionService.getSession(
        current.id,
      );

      if (this.isCurrentRequest(version)) {
        this.applySession(updated);
      }
    } catch (error: unknown) {
      if (this.isCurrentRequest(version)) {
        console.error(
          'Error al actualizar el progreso:',
          error,
        );

        this.actionError.set(
          'No se pudo actualizar el progreso. Inténtalo nuevamente.',
        );
      }
    } finally {
      if (this.isCurrentRequest(version)) {
        this.refreshing.set(false);
      }
    }
  }

  protected async completeExercise(): Promise<void> {
    const current = this.session();

    if (
      !current ||
      current.finished_at ||
      this.saving() ||
      this.refreshing() ||
      this.loading()
    ) {
      return;
    }

    const version = this.requestVersion;

    this.saving.set(true);
    this.actionError.set('');
    this.announcement.set('');

    try {
      const updated =
        await this.sessionService.completeNextExercise(
          current.id,
          current.completed_count,
        );

      if (!this.isCurrentRequest(version)) {
        return;
      }

      this.applySession(updated);

      this.announcement.set(
        updated.finished_at
          ? 'Entrenamiento finalizado y guardado.'
          : 'Progreso guardado. Puedes continuar con el siguiente ejercicio.',
      );
    } catch (error: unknown) {
      if (this.isCurrentRequest(version)) {
        console.error(
          'Error al guardar el progreso:',
          error,
        );

        this.actionError.set(
          'No se pudo confirmar el avance. Pulsa Actualizar progreso antes de volver a intentarlo.',
        );
      }
    } finally {
      if (this.isCurrentRequest(version)) {
        this.saving.set(false);
      }
    }
  }

  private async loadPage(): Promise<void> {
    const version = ++this.requestVersion;

    this.disconnectRealtime();

    this.loading.set(true);
    this.saving.set(false);
    this.refreshing.set(false);

    this.errorMessage.set('');
    this.actionError.set('');
    this.syncMessage.set('');
    this.announcement.set('');

    this.session.set(null);
    this.currentExercise.set(null);
    this.remainingExercises.set(0);

    this.routines.set([]);
    this.history.set([]);
    this.exerciseQueue.clear();

    const routineId =
      this.route.snapshot.paramMap.get('routineId');

    const sessionId =
      this.route.snapshot.queryParamMap.get('session');

    try {
      if (!routineId) {
        const [routines, history] = await Promise.all([
          this.routineService.getMyRoutines(),
          this.sessionService.getHistory(),
        ]);

        if (!this.isCurrentRequest(version)) {
          return;
        }

        this.routines.set(routines);
        this.history.set(history);

        return;
      }

      if (!sessionId) {
        const started =
          await this.sessionService.startOrResume(routineId);

        if (!this.isCurrentRequest(version)) {
          return;
        }

        const navigated = await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            session: started.id,
          },
          replaceUrl: true,
        });

        if (
          !navigated &&
          this.isCurrentRequest(version)
        ) {
          throw new Error(
            'No se pudo abrir la sesión de entrenamiento.',
          );
        }

        return;
      }

      const saved =
        await this.sessionService.getSession(sessionId);

      if (!this.isCurrentRequest(version)) {
        return;
      }

      if (
        saved.routine_id !== null &&
        saved.routine_id !== routineId
      ) {
        throw new Error(
          'La sesión no corresponde a esta rutina.',
        );
      }

      this.applySession(saved);
      this.connectRealtime(saved.id, version);
    } catch (error: unknown) {
      if (this.isCurrentRequest(version)) {
        console.error(
          'Error al preparar el entrenamiento:',
          error,
        );

        this.errorMessage.set(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el entrenamiento. Inténtalo nuevamente.',
        );
      }
    } finally {
      if (this.isCurrentRequest(version)) {
        this.loading.set(false);
      }
    }
  }

  private applySession(saved: TrainingSession): void {
    const previous = this.session();

    // No retroceder por una respuesta antigua de otra consulta.
    if (
      previous?.id === saved.id &&
      saved.completed_count < previous.completed_count
    ) {
      return;
    }

    this.exerciseQueue.clear();

    const exercises = [...saved.exercises].sort(
      (first, second) => first.position - second.position,
    );

    for (const exercise of exercises) {
      this.exerciseQueue.enqueue({
        ...exercise,
        name:
          this.exerciseNames.get(exercise.exercise_id)
          ?? `Ejercicio (${exercise.exercise_id})`,
      });
    }

    // Reconstruir la cola pendiente desde el progreso guardado.
    for (
      let index = 0;
      index < saved.completed_count;
      index += 1
    ) {
      this.exerciseQueue.dequeue();
    }

    this.session.set(saved);

    this.currentExercise.set(
      this.exerciseQueue.peek() ?? null,
    );

    this.remainingExercises.set(
      this.exerciseQueue.size,
    );
  }

  private connectRealtime(
    sessionId: string,
    version: number,
  ): void {
    this.syncMessage.set('Conectando sincronización...');

    this.channel = this.sessionService.watchSession(
      sessionId,
      () => {
        void this.reloadFromRealtime(sessionId, version);
      },
      (status) => {
        if (!this.isCurrentRequest(version)) {
          return;
        }

        if (status === 'SUBSCRIBED') {
          this.syncMessage.set(
            'Conexión de tiempo real activa.',
          );

          void this.reloadFromRealtime(sessionId, version);
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          this.syncMessage.set(
            'Sin conexión de tiempo real. Puedes usar Actualizar progreso.',
          );
        }
      },
    );
  }

  private async reloadFromRealtime(
    sessionId: string,
    version: number,
  ): Promise<void> {
    try {
      const saved =
        await this.sessionService.getSession(sessionId);

      if (!this.isCurrentRequest(version)) {
        return;
      }

      const previousCount = this.completedExercises();

      this.applySession(saved);

      if (saved.completed_count > previousCount) {
        this.announcement.set(
          saved.finished_at
            ? 'La sesión se completó y quedó guardada.'
            : 'El progreso se actualizó desde la base de datos.',
        );
      }
    } catch (error: unknown) {
      if (this.isCurrentRequest(version)) {
        console.error(
          'Error al sincronizar el progreso:',
          error,
        );

        this.syncMessage.set(
          'No se pudo consultar la última actualización. Usa Actualizar progreso.',
        );
      }
    }
  }

  private disconnectRealtime(): void {
    const channel = this.channel;

    this.channel = null;

    if (channel) {
      void this.sessionService
        .stopWatching(channel)
        .catch((error: unknown) => {
          console.error(
            'Error al cerrar la sincronización:',
            error,
          );
        });
    }
  }

  private isCurrentRequest(version: number): boolean {
    return (
      version === this.requestVersion &&
      !this.destroyRef.destroyed
    );
  }
}