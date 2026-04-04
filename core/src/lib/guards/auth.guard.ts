import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONTRACT } from '../contracts/auth.contract';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AUTH_CONTRACT);
  const router = inject(Router);

  // Si tenemos un usuario en el estado, permitimos el paso
  if (authService.currentUser() !== null) {
    return true;
  }

  // De lo contrario, lo rebotamos al login
  return router.createUrlTree(['/auth']);
};
