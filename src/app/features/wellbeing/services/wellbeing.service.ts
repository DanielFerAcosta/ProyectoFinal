import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  SaveWellbeingEntry,
  WellbeingEntry,
} from '../models/wellbeing-entry.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  async getEntryByDate(
    entryDate: string,
  ): Promise<WellbeingEntry | null> {
    const userId = await this.requireUserId();
    const date = this.validateDate(entryDate);

    const { data, error } = await this.supabase
      .from('wellbeing_entries')
      .select(`
        id,
        user_id,
        entry_date,
        water_ml,
        sleep_minutes,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('entry_date', date)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as WellbeingEntry | null;
  }

  async getHistory(
    limit = 30,
  ): Promise<WellbeingEntry[]> {
    const userId = await this.requireUserId();

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new Error(
        'La cantidad de registros debe ser un entero entre 1 y 100.',
      );
    }

    const { data, error } = await this.supabase
      .from('wellbeing_entries')
      .select(`
        id,
        user_id,
        entry_date,
        water_ml,
        sleep_minutes,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []) as WellbeingEntry[];
  }

  async saveEntry(
    input: SaveWellbeingEntry,
  ): Promise<WellbeingEntry> {
    const userId = await this.requireUserId();
    const date = this.validateDate(input.entry_date);

    this.validateWater(input.water_ml);
    this.validateSleep(input.sleep_minutes);

    const { data, error } = await this.supabase
      .from('wellbeing_entries')
      .upsert(
        {
          user_id: userId,
          entry_date: date,
          water_ml: input.water_ml,
          sleep_minutes: input.sleep_minutes,
        },
        {
          onConflict: 'user_id,entry_date',
          ignoreDuplicates: false,
        },
      )
      .select(`
        id,
        user_id,
        entry_date,
        water_ml,
        sleep_minutes,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        'El servidor no devolvió el registro guardado.',
      );
    }

    return data as WellbeingEntry;
  }

  private async requireUserId(): Promise<string> {
    await this.auth.ready;

    const currentUser = this.auth.user();

    if (!currentUser) {
      throw new Error(
        'Debes iniciar sesión para consultar o guardar tu bienestar.',
      );
    }

    return currentUser.id;
  }

  private validateDate(value: string): string {
    const date = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(
        'La fecha debe tener el formato YYYY-MM-DD.',
      );
    }

    const [year, month, day] = date
      .split('-')
      .map(Number);

    if (year < 1) {
      throw new Error(
        'Selecciona una fecha válida.',
      );
    }

    const parsed = new Date(0);

    parsed.setUTCFullYear(year, month - 1, day);
    parsed.setUTCHours(0, 0, 0, 0);

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new Error(
        'Selecciona una fecha válida.',
      );
    }

    return date;
  }

  private validateWater(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 2147483647
    ) {
      throw new Error(
        'El agua debe ser una cantidad entera no negativa, en mililitros, dentro del rango permitido.',
      );
    }
  }

  private validateSleep(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 1440
    ) {
      throw new Error(
        'El sueño debe ser una cantidad entera entre 0 y 1440 minutos.',
      );
    }
  }
}