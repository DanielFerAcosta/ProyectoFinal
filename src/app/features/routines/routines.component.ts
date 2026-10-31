import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { EXERCISES } from '../catalog/data/exercises.data';
import { Routine } from './models/routine.model';
import { RoutineService } from './services/routine.service';

interface ExerciseDraft {
  exercise_id: string;
  name: string;
  selected: boolean;
  sets: number;
  repetitions: number;
}

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    NavbarComponent,
  ],
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss',
})
export class RoutinesComponent implements OnInit {
  private readonly routineService = inject(RoutineService);

  private readonly exerciseNames = new Map(
    EXERCISES.map((exercise) => [
      exercise.id,
      exercise.name,
    ]),
  );

  protected readonly routines = signal<Routine[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly errorMessage = signal('');
  protected readonly formError = signal('');
  protected readonly successMessage = signal('');

  protected routineName = '';

  protected readonly exerciseDrafts: ExerciseDraft[] =
    EXERCISES.map((exercise) => ({
      exercise_id: exercise.id,
      name: exercise.name,
      selected: false,
      sets: 1,
      repetitions: 1,
    }));

  async ngOnInit(): Promise<void> {
    await this.loadRoutines();
  }

  protected async loadRoutines(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const routines = await this.routineService.getMyRoutines();

      this.routines.set(routines);
    } catch (error: unknown) {
      console.error('Error al cargar las rutinas:', error);

      this.errorMessage.set(
        'No se pudieron cargar tus rutinas. Comprueba la conexión e inténtalo nuevamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveRoutine(form: NgForm): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.formError.set('');
    this.successMessage.set('');

    const name = this.routineName.trim();

    if (name.length === 0 || name.length > 80) {
      this.formError.set(
        'Escribe un nombre de entre 1 y 80 caracteres.',
      );
      return;
    }

    const selectedExercises = this.exerciseDrafts.filter(
      (exercise) => exercise.selected,
    );

    if (selectedExercises.length === 0) {
      this.formError.set(
        'Selecciona al menos un ejercicio.',
      );
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();

      this.formError.set(
        'Revisa las series y repeticiones de los ejercicios seleccionados.',
      );
      return;
    }

    this.saving.set(true);

    try {
      await this.routineService.createRoutine({
        name,
        exercises: selectedExercises.map((exercise) => ({
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
        })),
      });
    } catch (error: unknown) {
      console.error('Error al guardar la rutina:', error);

      this.formError.set(
        'No se pudo confirmar el guardado. Comprueba tu conexión y actualiza el listado antes de volver a intentarlo.',
      );
      return;
    } finally {
      this.saving.set(false);
    }

    this.resetDraft(form);
    this.successMessage.set('Rutina guardada correctamente.');

    await this.loadRoutines();
  }

  protected getExerciseName(exerciseId: string): string {
    return this.exerciseNames.get(exerciseId)
      ?? `Ejercicio no disponible (${exerciseId})`;
  }

  private resetDraft(form: NgForm): void {
    form.resetForm();

    this.routineName = '';

    for (const exercise of this.exerciseDrafts) {
      exercise.selected = false;
      exercise.sets = 1;
      exercise.repetitions = 1;
    }
  }
}