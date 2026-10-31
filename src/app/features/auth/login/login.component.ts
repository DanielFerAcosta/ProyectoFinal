import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected showPassword = false;
  protected loading = false;
  protected message = '';

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected async onSubmit(): Promise<void> {
    if (this.loading) {
      return;
    }

    this.message = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const { email, password } = this.loginForm.getRawValue();

      await this.auth.login(email, password);
      this.loginForm.controls.password.reset();

      await this.router.navigateByUrl('/panel');
    } catch {
      this.message =
        'No fue posible iniciar sesión. Revisa tus datos, la confirmación del correo y tu conexión.';
    } finally {
      this.loading = false;
    }
  }
}
