import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;

  if (!password || !confirmation) {
    return null;
  }

  return password === confirmation
    ? null
    : { passwordsMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected showPassword = false;
  protected showConfirmPassword = false;
  protected loading = false;
  protected message = '';

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80),
          Validators.pattern(/\S/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  protected async onSubmit(): Promise<void> {
    if (this.loading) {
      return;
    }

    this.message = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();

    if (name.trim().length < 2) {
      this.registerForm.controls.name.setErrors({ minlength: true });
      this.registerForm.controls.name.markAsTouched();
      return;
    }

    this.loading = true;

    try {
      const data = await this.auth.register(name, email, password);

      this.registerForm.controls.password.reset();
      this.registerForm.controls.confirmPassword.reset();

      if (data.session) {
        await this.router.navigateByUrl('/panel');
      } else {
        this.message =
          'Si el registro puede completarse con este correo, recibirás un mensaje de confirmación. Revisa tu bandeja y spam. Si ya tenías cuenta, inicia sesión.';
      }
    } catch {
      this.message =
        'No fue posible completar el registro. Revisa los datos, la conexión e inténtalo más tarde.';
    } finally {
      this.loading = false;
    }
  }
}
