import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StoreService } from './services/store.service';
import { ReminderService } from './services/reminder.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'NutriTrack';

  private store = inject(StoreService);
  private router = inject(Router);
  reminders = inject(ReminderService);

  isAuthenticated = this.store.isAuthenticated;
  isSubscribed = this.store.isSubscribed;
  currentUser = this.store.currentUser;

  nav = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/food-log', label: 'Food Log', icon: '🍴' },
    { path: '/recipes', label: 'Recipes', icon: '🍽️' },
    { path: '/workouts', label: 'Workouts', icon: '🏃' },
    { path: '/water', label: 'Water', icon: '💧' },
    { path: '/health', label: 'Health', icon: '🩺' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  logout(): void {
    this.store.logout();
    this.router.navigateByUrl('/login');
  }
}
