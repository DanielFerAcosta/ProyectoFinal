import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  protected readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly authReady = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly logoutError = signal('');

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    this.authReady.set(true);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected async logout(): Promise<void> {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.logoutError.set('');

    try {
      await this.auth.logout();
    } catch {
      this.logoutError.set(
        'No se pudo cerrar la sesión. Inténtalo nuevamente.',
      );

      this.loggingOut.set(false);
      return;
    }

    this.closeMenu();

    try {
      if (this.router.url !== '/') {
        const navigated = await this.router.navigateByUrl(
          '/',
          { replaceUrl: true },
        );

        if (!navigated && this.router.url !== '/') {
          this.logoutError.set(
            'La sesión se cerró, pero no se pudo abrir el inicio.',
          );
        }
      }
    } catch {
      if (this.router.url !== '/') {
        this.logoutError.set(
          'La sesión se cerró, pero no se pudo abrir el inicio.',
        );
      }
    } finally {
      this.loggingOut.set(false);
    }
  }
}