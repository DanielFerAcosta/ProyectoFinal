import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { WellbeingEntry } from './models/wellbeing-entry.model';
import { WellbeingService } from './services/wellbeing.service';

function integerValidator(
  control: AbstractControl,
): ValidationErrors | null {
  return Number.isInteger(control.value)
    ? null
    : { integer: true };
}

function localDateToday(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    today.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-wellbeing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NavbarComponent,
  ],
  templateUrl: './wellbeing.component.html',
  styleUrl: './wellbeing.component.scss',
})
export class WellbeingComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly wellbeingService = inject(WellbeingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly selectedDate = signal(
    localDateToday(),
  );

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly entryReady = signal(false);

  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly existingEntry =
    signal<WellbeingEntry | null>(null);

  protected readonly history =
    signal<WellbeingEntry[]>([]);

  protected readonly form =
    this.formBuilder.nonNullable.group({
      water_ml: [
        0,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(2147483647),
          integerValidator,
        ],
      ],
      sleep_minutes: [
        0,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1440),
          integerValidator,
        ],
      ],
    });

  ngOnInit(): void {
    void this.loadSelectedDate();
  }

  protected async changeDate(
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;

    await this.openDate(input.value);
  }

  protected async openDate(
    date: string,
  ): Promise<void> {
    if (
      !date ||
      this.loading() ||
      this.saving()
    ) {
      return;
    }

    this.selectedDate.set(date);

    await this.loadSelectedDate();
  }

  protected retry(): void {
    void this.loadSelectedDate();
  }

  protected async save(): Promise<void> {
    if (
      this.loading() ||
      this.saving() ||
      !this.entryReady()
    ) {
      return;
    }

    this.form.markAllAsTouched();
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set(
        'Revisa los campos antes de guardar.',
      );

      return;
    }

    this.saving.set(true);

    try {
      const values = this.form.getRawValue();

      const saved =
        await this.wellbeingService.saveEntry({
          entry_date: this.selectedDate(),
          water_ml: values.water_ml,
          sleep_minutes: values.sleep_minutes,
        });

      if (this.destroyRef.destroyed) {
        return;
      }

      this.existingEntry.set(saved);

      this.form.reset({
        water_ml: saved.water_ml,
        sleep_minutes: saved.sleep_minutes,
      });

      this.history.update((entries) => {
        const updated = entries.filter(
          (entry) => entry.id !== saved.id,
        );

        updated.push(saved);

        return updated
          .sort((first, second) =>
            second.entry_date.localeCompare(
              first.entry_date,
            ),
          )
          .slice(0, 30);
      });

      this.successMessage.set(
        'Tu registro de bienestar quedó guardado.',
      );
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) {
        console.error(
          'Error al guardar bienestar:',
          error,
        );

        this.errorMessage.set(
          'No se pudo confirmar el guardado. Los valores siguen en el formulario para que puedas reintentarlo.',
        );
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.saving.set(false);
      }
    }
  }

  protected formatMinutes(
    totalMinutes: number,
  ): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} h ${minutes} min`;
  }

  private async loadSelectedDate(): Promise<void> {
    if (this.loading() || this.saving()) {
      return;
    }

    this.loading.set(true);
    this.entryReady.set(false);

    this.errorMessage.set('');
    this.successMessage.set('');
    this.existingEntry.set(null);

    try {
      const [entry, history] = await Promise.all([
        this.wellbeingService.getEntryByDate(
          this.selectedDate(),
        ),
        this.wellbeingService.getHistory(),
      ]);

      if (this.destroyRef.destroyed) {
        return;
      }

      this.existingEntry.set(entry);
      this.history.set(history);

      this.form.reset({
        water_ml: entry?.water_ml ?? 0,
        sleep_minutes: entry?.sleep_minutes ?? 0,
      });

      this.entryReady.set(true);
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) {
        console.error(
          'Error al cargar bienestar:',
          error,
        );

        this.errorMessage.set(
          'No se pudieron cargar tus registros. Pulsa Reintentar.',
        );
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.loading.set(false);
      }
    }
  }
}