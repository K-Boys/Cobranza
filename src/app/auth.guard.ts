import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = () => {
  if (typeof window === 'undefined') return true;
  
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.currentUser()) {
    return true;
  }
  return router.parseUrl('/login');
};

export const permissionGuard = (permission: string) => {
  return () => {
    if (typeof window === 'undefined') return true;
    
    const auth = inject(AuthService);
    const router = inject(Router);
    
    if (auth.hasPermission(permission)) {
      return true;
    }
    // Si no tiene acceso, redigir a clients o layout principal, o simplemente al form login si no ta log.
    // Aunque authGuard pase, si no tiene perm:
    return router.parseUrl('/clients'); 
  };
};
