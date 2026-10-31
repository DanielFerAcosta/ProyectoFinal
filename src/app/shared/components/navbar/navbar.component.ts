import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly menuOpen = signal(false);
  protected readonly auth = inject(AuthService);

  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}