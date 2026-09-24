import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './auth.component.scss',
})
export class LoginComponent {
  private store = inject(StoreService);
  private router = inject(Router);

  username = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.username().trim() || !this.password()) {
      this.error.set('Please enter your username and password.');
      return;
    }
    this.busy.set(true);
    const result = await this.store.login(this.username(), this.password());
    this.busy.set(false);
    if (!result.ok) {
      this.error.set(result.error ?? 'Login failed.');
      return;
    }
    const dest = this.store.profile() ? '/dashboard' : '/setup';
    this.router.navigate([dest]);
  }
}
