import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  AuthService,
  UserProfile,
} from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);

  private readonly changeDetector = inject(ChangeDetectorRef);

  protected profile: UserProfile | null = null;
  protected loading = true;
  protected message = '';

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
}