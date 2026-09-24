import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreService } from '../services/store.service';

/** Allows navigation only when a user is signed in, otherwise redirects to /login. */
export const authGuard: CanActivateFn = () => {
  const store = inject(StoreService);
  const router = inject(Router);
  return store.isAuthenticated() ? true : router.parseUrl('/login');
};
