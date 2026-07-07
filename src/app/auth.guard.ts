import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = async () => {
  console.log('authGuard running on:', typeof window === 'undefined' ? 'server' : 'client');
  if (typeof window === 'undefined') return true;
  
  const auth = inject(AuthService);
  const router = inject(Router);
  
  await auth.sessionReady;
  
  console.log('authGuard session ready. currentUser:', auth.currentUser());

  if (auth.currentUser()) {
    return true;
  }
  return router.parseUrl('/login');
};

export const permissionGuard = (permission: string) => {
  return async () => {
    if (typeof window === 'undefined') return true;
    
    const auth = inject(AuthService);
    const router = inject(Router);
    
    await auth.sessionReady;

    if (auth.hasPermission(permission)) {
      return true;
    }
    // Si no tiene acceso, redigir a clients o layout principal, o simplemente al form login si no ta log.
    // Aunque authGuard pase, si no tiene perm:
    return router.parseUrl('/clients'); 
  };
};
