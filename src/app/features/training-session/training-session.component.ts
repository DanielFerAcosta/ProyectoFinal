import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { EXERCISES } from '../catalog/data/exercises.data';
import {
  Routine,
  RoutineExercise,
} from '../routines/models/routine.model';
import { RoutineService } from '../routines/services/routine.service';
import { Queue } from './structures/queue';

interface TrainingExercise extends RoutineExercise {
  name: string;
}

@Component({
  selector: 'app-training-session',
  standalone: true,
  imports: [
    RouterLink,
    NavbarComponent,
  ],
  templateUrl: './training-session.component.html',
  styleUrl: './training-session.component.scss',
})
export class TrainingSessionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routineService = inject(RoutineService);

  private readonly exerciseQueue = new Queue<TrainingExercise>();

  private readonly exerciseNames = new Map(
    EXERCISES.map((exercise) => [
      exercise.id,
      exercise.name,
    ]),
  );

  private requestVersion = 0;

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly routines = signal<Routine[]>([]);
  protected readonly selectedRoutine = signal<Routine | null>(null);

  protected readonly currentExercise =
    signal<TrainingExercise | null>(null);

  protected readonly totalExercises = signal(0);
  protected readonly completedExercises = signal(0);
  protected readonly remainingExercises = signal(0);

  protected readonly announcement = signal('');

  protected readonly progressPercentage = computed(() => {
    const total = this.totalExercises();

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.completedExercises() / total) * 100,
    );
  });

  async ngOnInit(): Promise<void> {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        void this.loadSession(params.get('routineId'));
      });
  }

  protected retry(): void {
    void this.loadSession(
      this.route.snapshot.paramMap.get('routineId'),
    );
  }

  protected completeExercise(): void {
    if (this.loading() || this.errorMessage()) {
      return;
    }

    const completed = this.exerciseQueue.dequeue();

    if (!completed) {
      return;
    }

    this.completedExercises.update((count) => count + 1);

    this.remainingExercises.set(this.exerciseQueue.size);

    const next = this.exerciseQueue.peek() ?? null;

    this.currentExercise.set(next);

    this.announcement.set(
      next
        ? `Completaste ${completed.name}. Siguiente ejercicio: ${next.name}.`
        : 'Completaste todos los ejercicios de esta sesión.',
    );
  }

  private async loadSession(
    routineId: string | null,
  ): Promise<void> {
    const version = ++this.requestVersion;

    this.loading.set(true);
    this.errorMessage.set('');
    this.announcement.set('');

    this.routines.set([]);
    this.selectedRoutine.set(null);
    this.currentExercise.set(null);

    this.exerciseQueue.clear();

    this.totalExercises.set(0);
    this.completedExercises.set(0);
    this.remainingExercises.set(0);

    try {
      const routines = await this.routineService.getMyRoutines();

      if (
        version !== this.requestVersion ||
        this.destroyRef.destroyed
      ) {
        return;
      }

      this.routines.set(routines);

      if (!routineId) {
        return;
      }

      const routine = routines.find(
        (item) => item.id === routineId,
      );

      if (!routine) {
        throw new Error(
          'La rutina no está disponible para esta cuenta.',
        );
      }

      if (routine.exercises.length === 0) {
        throw new Error(
          'Esta rutina no tiene ejercicios para iniciar el entrenamiento.',
        );
      }

      const exercises: TrainingExercise[] =
        [...routine.exercises]
          .sort(
            (first, second) =>
              first.position - second.position,
          )
          .map((exercise) => {
            const name = this.exerciseNames.get(
              exercise.exercise_id,
            );

            if (!name) {
              throw new Error(
                'La rutina contiene un ejercicio que no está disponible en el catálogo.',
              );
            }

            return {
              ...exercise,
              name,
            };
          });

      for (const exercise of exercises) {
        this.exerciseQueue.enqueue(exercise);
      }

      this.selectedRoutine.set(routine);
      this.totalExercises.set(this.exerciseQueue.size);
      this.remainingExercises.set(this.exerciseQueue.size);

      this.currentExercise.set(
        this.exerciseQueue.peek() ?? null,
      );
    } catch (error: unknown) {
      if (
        version !== this.requestVersion ||
        this.destroyRef.destroyed
      ) {
        return;
      }

      console.error(
        'Error al preparar el entrenamiento:',
        error,
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No se pudo preparar el entrenamiento. Inténtalo nuevamente.',
      );
    } finally {
      if (
        version === this.requestVersion &&
        !this.destroyRef.destroyed
      ) {
        this.loading.set(false);
      }
    }
  }
}