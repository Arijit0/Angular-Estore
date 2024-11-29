import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Check if running in the browser
  if (isPlatformBrowser(platformId)) {
    const user = localStorage.getItem('user');
    if (user) {
      return true; // User is authenticated, allow access
    }
  }

  // Redirect to the login page if user is not authenticated
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};