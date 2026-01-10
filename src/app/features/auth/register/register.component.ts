import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-]{8,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validateur personnalisé pour la correspondance des mots de passe
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const userData: RegisterRequest = {
      name: this.registerForm.get('name')?.value,
      email: this.registerForm.get('email')?.value,
      contact: this.registerForm.get('contact')?.value,
      password: this.registerForm.get('password')?.value,
      role: 'CLIENT',
      active: true
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Compte créé avec succès ! Redirection vers la page de connexion...');
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set(error.error?.message || 'Données invalides');
        } else if (error.status === 409) {
          this.errorMessage.set('Un compte avec cet email existe déjà');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  // Getters pour les validations du template
  get nameErrors(): string | null {
    const control = this.registerForm.get('name');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Le nom est requis';
      if (control.errors['minlength']) return 'Le nom doit contenir au moins 2 caractères';
    }
    return null;
  }

  get emailErrors(): string | null {
    const control = this.registerForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'L\'email est requis';
      if (control.errors['email']) return 'Format d\'email invalide';
    }
    return null;
  }

  get contactErrors(): string | null {
    const control = this.registerForm.get('contact');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Le numéro de contact est requis';
      if (control.errors['pattern']) return 'Format de numéro invalide';
    }
    return null;
  }

  get passwordErrors(): string | null {
    const control = this.registerForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Le mot de passe est requis';
      if (control.errors['minlength']) return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  }

  get confirmPasswordErrors(): string | null {
    const control = this.registerForm.get('confirmPassword');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Confirmez le mot de passe';
      if (control.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  get acceptTermsErrors(): string | null {
    const control = this.registerForm.get('acceptTerms');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Vous devez accepter les conditions';
    }
    return null;
  }
}
