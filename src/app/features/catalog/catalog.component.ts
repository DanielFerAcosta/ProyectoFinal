import { Component, computed, signal } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { EXERCISES } from './data/exercises.data';
import { createExerciseGraph } from './data/exercise-connections.data';
import {
  Equipment,
  ExerciseLevel,
  MuscleGroup,
} from './models/exercise.model';
import { ExerciseTrie } from './structures/exercise-trie';

type FilterValue<T> = T | 'all';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  private readonly exerciseTrie = new ExerciseTrie();
  private readonly exerciseGraph = createExerciseGraph();

  protected readonly searchQuery = signal('');
  protected readonly suggestionsOpen = signal(false);

  protected readonly equipment = signal<FilterValue<Equipment>>('all');
  protected readonly level = signal<FilterValue<ExerciseLevel>>('all');
  protected readonly muscleGroup = signal<FilterValue<MuscleGroup>>('all');

  protected readonly selectedExerciseId = signal<string | null>(null);

  protected readonly alternativeEquipment =
    signal<FilterValue<Equipment>>('all');

  protected readonly alternativeLevel =
    signal<FilterValue<ExerciseLevel>>('all');

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

  protected readonly matchingExerciseIds = computed(
    () =>
      new Set(
        this.exerciseTrie.searchByPrefix(this.searchQuery()),
      ),
  );

  protected readonly searchSuggestions = computed(() => {
    if (
      !this.suggestionsOpen() ||
      this.searchQuery().trim() === ''
    ) {
      return [];
    }

    const matchingIds = this.matchingExerciseIds();

    return EXERCISES
      .filter((exercise) => matchingIds.has(exercise.id))
      .slice(0, 5);
  });

  protected readonly filteredExercises = computed(() => {
    const matchingIds = this.matchingExerciseIds();

    return EXERCISES.filter((exercise) => {
      const matchesSearch = matchingIds.has(exercise.id);

      const matchesEquipment =
        this.equipment() === 'all' ||
        exercise.equipment === this.equipment();

      const matchesLevel =
        this.level() === 'all' ||
        exercise.level === this.level();

      const matchesMuscle =
        this.muscleGroup() === 'all' ||
        exercise.muscleGroup === this.muscleGroup();

      return (
        matchesSearch &&
        matchesEquipment &&
        matchesLevel &&
        matchesMuscle
      );
    });
  });

  protected readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.equipment() !== 'all' ||
      this.level() !== 'all' ||
      this.muscleGroup() !== 'all',
  );

  protected readonly selectedExercise = computed(() => {
    const selectedId = this.selectedExerciseId();

    return EXERCISES.find(
      (exercise) => exercise.id === selectedId,
    ) ?? null;
  });

  protected readonly connectedExercises = computed(() => {
    const selectedId = this.selectedExerciseId();

    if (selectedId === null) {
      return [];
    }

    const neighborIds = new Set(
      this.exerciseGraph.getNeighbors(selectedId),
    );

    return EXERCISES.filter(
      (exercise) => neighborIds.has(exercise.id),
    );
  });

  protected readonly filteredAlternatives = computed(
    () =>
      this.connectedExercises().filter((exercise) => {
        const matchesEquipment =
          this.alternativeEquipment() === 'all' ||
          exercise.equipment === this.alternativeEquipment();

        const matchesLevel =
          this.alternativeLevel() === 'all' ||
          exercise.level === this.alternativeLevel();

        return matchesEquipment && matchesLevel;
      }),
  );

  protected readonly hasAlternativeFilters = computed(
    () =>
      this.alternativeEquipment() !== 'all' ||
      this.alternativeLevel() !== 'all',
  );

  constructor() {
    for (const exercise of EXERCISES) {
      this.exerciseTrie.insert(exercise.name, exercise.id);
    }
  }

  protected changeSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchQuery.set(input.value);
    this.suggestionsOpen.set(true);
    this.closeAlternatives();
  }

  protected openSuggestions(): void {
    this.suggestionsOpen.set(true);
  }

  protected closeSuggestions(): void {
    this.suggestionsOpen.set(false);
  }

  protected selectSuggestion(name: string): void {
    this.searchQuery.set(name);
    this.suggestionsOpen.set(false);
    this.closeAlternatives();
  }

  protected changeEquipment(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (this.isEquipmentFilter(value)) {
      this.equipment.set(value);
      this.closeAlternatives();
    }
  }

  protected changeLevel(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (this.isLevelFilter(value)) {
      this.level.set(value);
      this.closeAlternatives();
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
      this.closeAlternatives();
    }
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.suggestionsOpen.set(false);
    this.equipment.set('all');
    this.level.set('all');
    this.muscleGroup.set('all');
    this.closeAlternatives();
  }

  protected toggleAlternatives(exerciseId: string): void {
    if (this.selectedExerciseId() === exerciseId) {
      this.closeAlternatives();
      return;
    }

    if (!this.exerciseGraph.hasVertex(exerciseId)) {
      return;
    }

    this.resetAlternativeFilters();
    this.suggestionsOpen.set(false);
    this.selectedExerciseId.set(exerciseId);
  }

  protected closeAlternatives(): void {
    this.selectedExerciseId.set(null);
    this.resetAlternativeFilters();
  }

  protected changeAlternativeEquipment(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (this.isEquipmentFilter(value)) {
      this.alternativeEquipment.set(value);
    }
  }

  protected changeAlternativeLevel(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (this.isLevelFilter(value)) {
      this.alternativeLevel.set(value);
    }
  }

  protected resetAlternativeFilters(): void {
    this.alternativeEquipment.set('all');
    this.alternativeLevel.set('all');
  }

  private isEquipmentFilter(
    value: string,
  ): value is FilterValue<Equipment> {
    return (
      value === 'all' ||
      value === 'bodyweight' ||
      value === 'dumbbells' ||
      value === 'machine'
    );
  }

  private isLevelFilter(
    value: string,
  ): value is FilterValue<ExerciseLevel> {
    return (
      value === 'all' ||
      value === 'beginner' ||
      value === 'intermediate'
    );
  }
}