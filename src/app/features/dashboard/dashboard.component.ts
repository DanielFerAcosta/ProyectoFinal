import {
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
    } catch {
      this.message =
        'No se pudo cargar tu perfil. Comprueba la conexión y la configuración de la base de datos.';
    } finally {
      this.loading = false;
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
    } catch {
      this.message =
        'No se pudo cerrar la sesión. Inténtalo nuevamente.';
    } finally {
      this.signingOut = false;
    }
  }
}
