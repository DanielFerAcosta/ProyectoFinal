import {
  ChangeDetectorRef,
  Component,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AuthService,
  UserProfile,
} from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);

  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected profile: UserProfile | null = null;
  protected loading = true;
  protected signingOut = false;
  protected message = '';

  constructor() {
    effect(() => {
      if (!this.auth.user()) {
        void this.router.navigateByUrl('/login');
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.profile = await this.auth.getProfile();
    } catch (error: unknown) {
      console.error('Error al cargar el perfil:', error);

      this.message =
        'No se pudo cargar tu perfil. Comprueba la conexión y la configuración de la base de datos.';
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  protected async logout(): Promise<void> {
    if (this.signingOut) {
      return;
    }

    this.signingOut = true;
    this.message = '';

    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } catch (error: unknown) {
      console.error('Error al cerrar la sesión:', error);

      this.message = this.auth.user()
        ? 'No se pudo cerrar la sesión. Inténtalo nuevamente.'
        : 'La sesión se cerró, pero no se pudo completar la navegación.';
    } finally {
      this.signingOut = false;
      this.changeDetector.markForCheck();
    }
  }
}