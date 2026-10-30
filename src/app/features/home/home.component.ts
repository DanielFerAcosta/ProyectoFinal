import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

type EquipmentFilter = 'all' | 'bodyweight' | 'home' | 'gym';

interface ExercisePreview {
  id: number;
  name: string;
  muscle: string;
  equipment: Exclude<EquipmentFilter, 'all'>;
  equipmentLabel: string;
  symbol: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected selectedEquipment: EquipmentFilter = 'all';

  protected readonly equipmentFilters: {
    value: EquipmentFilter;
    label: string;
  }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'bodyweight', label: 'Peso corporal' },
    { value: 'home', label: 'En casa' },
    { value: 'gym', label: 'Gimnasio' },
  ];

  protected readonly exercises: ExercisePreview[] = [
    {
      id: 1,
      name: 'Sentadilla sin carga',
      muscle: 'Tren inferior',
      equipment: 'bodyweight',
      equipmentLabel: 'Sin equipo',
      symbol: '01',
    },
    {
      id: 2,
      name: 'Remo con mancuerna',
      muscle: 'Espalda',
      equipment: 'home',
      equipmentLabel: 'Mancuerna',
      symbol: '02',
    },
    {
      id: 3,
      name: 'Jalón al pecho',
      muscle: 'Espalda',
      equipment: 'gym',
      equipmentLabel: 'Polea',
      symbol: '03',
    },
    {
      id: 4,
      name: 'Flexiones',
      muscle: 'Tren superior',
      equipment: 'bodyweight',
      equipmentLabel: 'Sin equipo',
      symbol: '04',
    },
    {
      id: 5,
      name: 'Curl con mancuernas',
      muscle: 'Brazos',
      equipment: 'home',
      equipmentLabel: 'Mancuernas',
      symbol: '05',
    },
    {
      id: 6,
      name: 'Prensa de piernas',
      muscle: 'Tren inferior',
      equipment: 'gym',
      equipmentLabel: 'Máquina',
      symbol: '06',
    },
  ];

  protected get filteredExercises(): ExercisePreview[] {
    if (this.selectedEquipment === 'all') {
      return this.exercises;
    }

    return this.exercises.filter(
      (exercise) => exercise.equipment === this.selectedEquipment,
    );
  }

  protected selectEquipment(equipment: EquipmentFilter): void {
    this.selectedEquipment = equipment;
  }
}