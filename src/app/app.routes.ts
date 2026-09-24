import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'setup',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/setup/setup.component').then((m) => m.SetupComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'food-log',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/food-log/food-log.component').then((m) => m.FoodLogComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'workouts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/workouts/workouts.component').then((m) => m.WorkoutsComponent),
  },
  {
    path: 'water',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/water/water.component').then((m) => m.WaterComponent),
  },
  {
    path: 'health',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/health/health.component').then((m) => m.HealthComponent),
  },
  {
    path: 'recipes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
