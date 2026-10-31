import {
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id: string;
  full_name: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly supabase = inject(SupabaseService).client;
  private readonly sessionState = signal<Session | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);

  private resolveReady!: () => void;

  readonly ready = new Promise<void>((resolve) => {
    this.resolveReady = resolve;
  });

  private readonly subscription = this.supabase.auth.onAuthStateChange(
    (_event, session) => {
      this.sessionState.set(session);
      this.resolveReady();
    },
  ).data.subscription;

  async register(name: string, email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      this.sessionState.set(data.session);
    }

    return data;
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    this.sessionState.set(data.session);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut({
      scope: 'local',
    });

    if (error) {
      throw error;
    }

    this.sessionState.set(null);
  }

  async getProfile(): Promise<UserProfile> {
    await this.ready;

    const currentUser = this.user();

    if (!currentUser) {
      throw new Error('No hay una sesión activa.');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
