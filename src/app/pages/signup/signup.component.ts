import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { EMAIL_REGEX, PASSWORD_ALLOWED_REGEX, PASSWORD_MIN_LENGTH } from '../../constants';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: '../login/auth.component.scss',
})
export class SignupComponent {
  private store = inject(StoreService);
  private router = inject(Router);

  name = signal('');
  firstname = signal('');
  email = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

  // ---- Password strength rules ----
  /** Only letters, digits and the allowed specials { ! @ . - _ } are permitted. */
  private static readonly ALLOWED = PASSWORD_ALLOWED_REGEX;

  hasLength = computed(() => this.password().length >= PASSWORD_MIN_LENGTH);
  hasLower = computed(() => /[a-z]/.test(this.password()));
  hasUpper = computed(() => /[A-Z]/.test(this.password()));
  hasNumber = computed(() => /[0-9]/.test(this.password()));
  onlyAllowed = computed(() => this.password().length > 0 && SignupComponent.ALLOWED.test(this.password()));

  passwordValid = computed(
    () =>
      this.hasLength() &&
      this.hasLower() &&
      this.hasUpper() &&
      this.hasNumber() &&
      this.onlyAllowed(),
  );

  /** Live email validity for inline feedback. */
  emailValid = computed(() => EMAIL_REGEX.test(this.email().trim()));
  emailTouched = computed(() => this.email().length > 0);

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.name().trim() || !this.firstname().trim()) {
      this.error.set('Please enter your name and first name.');
      return;
    }
    if (!this.emailValid()) {
      this.error.set('Please enter a valid email address.');
      return;
    }
    if (!this.passwordValid()) {
      this.error.set('Your password does not meet the requirements below.');
      return;
    }
    this.busy.set(true);
    const result = await this.store.signUp({
      name: this.name(),
      firstname: this.firstname(),
      email: this.email(),
      password: this.password(),
    });
    this.busy.set(false);
    if (!result.ok) {
      this.error.set(result.error ?? 'Sign up failed.');
      return;
    }
    this.router.navigate(['/setup']);
  }
}
