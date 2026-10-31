import { Component, computed, signal } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { EXERCISES } from './data/exercises.data';
import {
  Equipment,
  ExerciseLevel,
  MuscleGroup,
} from './models/exercise.model';

type FilterValue<T> = T | 'all';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  protected readonly equipment = signal<FilterValue<Equipment>>('all');
  protected readonly level = signal<FilterValue<ExerciseLevel>>('all');
  protected readonly muscleGroup = signal<FilterValue<MuscleGroup>>('all');

  protected readonly equipmentLabels: Record<Equipment, string> = {
    bodyweight: 'Peso corporal',
    dumbbells: 'Mancuernas',
    machine: 'Máquina',
  };

  protected readonly levelLabels: Record<ExerciseLevel, string> = {
    beginner: 'Inicial',
    intermediate: 'Intermedio',
  };

  protected readonly muscleLabels: Record<MuscleGroup, string> = {
    legs: 'Piernas',
    chest: 'Pecho',
    back: 'Espalda',
    arms: 'Brazos',
  };

  protected readonly filteredExercises = computed(() =>
    EXERCISES.filter((exercise) => {
      const matchesEquipment =
        this.equipment() === 'all' ||
        exercise.equipment === this.equipment();

      const matchesLevel =
        this.level() === 'all' ||
        exercise.level === this.level();

      const matchesMuscle =
        this.muscleGroup() === 'all' ||
        exercise.muscleGroup === this.muscleGroup();

      return matchesEquipment && matchesLevel && matchesMuscle;
    }),
  );

  protected readonly hasActiveFilters = computed(
    () =>
      this.equipment() !== 'all' ||
      this.level() !== 'all' ||
      this.muscleGroup() !== 'all',
  );

  protected changeEquipment(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (
      value === 'all' ||
      value === 'bodyweight' ||
      value === 'dumbbells' ||
      value === 'machine'
    ) {
      this.equipment.set(value);
    }
  }

  protected changeLevel(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (
      value === 'all' ||
      value === 'beginner' ||
      value === 'intermediate'
    ) {
      this.level.set(value);
    }
  }

  protected changeMuscleGroup(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (
      value === 'all' ||
      value === 'legs' ||
      value === 'chest' ||
      value === 'back' ||
      value === 'arms'
    ) {
      this.muscleGroup.set(value);
    }
  }

  protected resetFilters(): void {
    this.equipment.set('all');
    this.level.set('all');
    this.muscleGroup.set('all');
  }
}