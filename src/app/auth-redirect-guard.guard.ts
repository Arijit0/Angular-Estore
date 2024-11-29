import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authRedirectGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Check if running in the browser
  if (isPlatformBrowser(platformId)) {
    const user = localStorage.getItem('user');
    if (user) {
      // Redirect logged-in users to the personal info page
      router.navigate(['/personal-info/account']);
      return false; // Prevent access to login/signup
    }
  }

  return true; // Allow access if the user is not logged in
};