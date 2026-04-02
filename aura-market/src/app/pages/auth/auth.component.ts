import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AUTH_CONTRACT } from 'core';


type AuthTab = 'login' | 'register';

@Component({
  selector: 'aura-auth',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  //Inyecciones
  private authService = inject(AUTH_CONTRACT);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  //Estado
  public activeTab = signal<AuthTab>('login');
  public isLoading = signal<boolean>(false);
  public showPassword = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  //Formulario de login
  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  public registerForm: FormGroup = this.fb.group({
    firstname: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  //Cambio de tab
  setTab(tab: AuthTab) {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  //Login
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const email = this.sanitizeInput(this.loginForm.value.email);
      const password = this.loginForm.value.password;

      await this.authService.login({ email, password });
      this.router.navigate(['/my-account']);
    } catch (error: unknown) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  //Registro
  async onRegister(): Promise<void> {
    if (this.registerForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const firstName = this.sanitizeInput(this.registerForm.value.firstname ?? '');
      const email = this.sanitizeInput(this.registerForm.value.email);
      const password = this.registerForm.value.password;

      await this.authService.register({ firstName, email, password });
      this.router.navigate(['/my-account']);
    } catch (error: unknown) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  //Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }


  //Mapea errores de dominio a mensaje para el usuario
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      switch (error.message) {
        case 'AUTH_INVALID_CREDENTIALS':
          return 'Email o contraseña incorrectos.';
        case 'AUTH_TOO_MANY_ATTEMPTS':
          return 'Demasiados intentos. Intenta en 15 minutos.';
        case 'AUTH_SERVICE_UNAVAILABLE':
          return 'Servicio temporalmente no disponible.';
        case 'AUTH_EMAIL_ALREADY_EXISTS':
          return 'Este correo ya está registrado. Por favor, inicia sesión.';
        default:
          return 'Ocurrió un error inesperado.';
      }
    }
    return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }

  // Sanatiza la entrada para prevenir XSS
  private sanitizeInput(value:string): string {
    return value
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(
        /[<>"'&]/g,
        (char) =>
          ({
            // caracteres peligrosos
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;',
          })[char] ?? char,
      );
  }
}
