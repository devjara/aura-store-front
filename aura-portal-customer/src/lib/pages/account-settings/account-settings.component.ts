import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AUTH_CONTRACT } from 'core';

@Component({
  selector: 'aura-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AUTH_CONTRACT);

  // User State
  user = computed(() => this.authService.currentUser());
  userInitials = computed(() => {
    const f = this.user()?.firstname?.charAt(0) || 'A';
    const l = this.user()?.lastname?.charAt(0) || 'M';
    return `${f}${l}`.toUpperCase();
  });

  // Forms
  personalForm!: FormGroup;
  securityForm!: FormGroup;

  // UI States (Mocking API calls)
  isSavingPersonal = signal(false);
  isSavingSecurity = signal(false);
  personalSuccess = signal(false);
  securitySuccess = signal(false);

  ngOnInit() {
    this.initForms();
    this.populateUserData();
  }

  private initForms() {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$')]]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private populateUserData() {
    const currentUser = this.user();
    if (currentUser) {
      this.personalForm.patchValue({
        firstName: currentUser.firstname,
        lastName: currentUser.lastname,
        email: currentUser.email,
        phone: '' // Asumimos vacío porque PS nativo guarda el tel localmente en 'address'
      });
    }
  }

  // Validador cruzado (Cross-field) para verificar que las contraseñas coinciden
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPass = control.get('newPassword');
    const confirmPass = control.get('confirmPassword');
    if (!newPass || !confirmPass) return null;

    if (confirmPass.value && newPass.value !== confirmPass.value) {
      confirmPass.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (confirmPass.hasError('mismatch')) {
        confirmPass.setErrors(null);
      }
      return null;
    }
  }

  // --- Handlers (Mocks) ---

  async onSubmitPersonal() {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    // Fake API Call Delay
    this.isSavingPersonal.set(true);
    this.personalSuccess.set(false);
    
    setTimeout(() => {
      this.isSavingPersonal.set(false);
      this.personalSuccess.set(true);
      // Auto ocultar mensaje de éxito
      setTimeout(() => this.personalSuccess.set(false), 3000);
    }, 1500);
  }

  async onSubmitSecurity() {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }

    this.isSavingSecurity.set(true);
    this.securitySuccess.set(false);

    setTimeout(() => {
      this.isSavingSecurity.set(false);
      this.securitySuccess.set(true);
      this.securityForm.reset();
      setTimeout(() => this.securitySuccess.set(false), 3000);
    }, 1500);
  }
}
