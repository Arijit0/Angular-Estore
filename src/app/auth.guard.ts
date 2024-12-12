import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { MasterService } from './services/master.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(MasterService);
  const platformId = inject(PLATFORM_ID); // Inject PLATFORM_ID to determine platform

  // Ensure the guard only runs in the browser (not on the server)
  if (!isPlatformBrowser(platformId)) {
    console.warn('Guard executed on non-browser platform. Blocking access.');
    return false; // Block access if not running in the browser
  }

  const user = authService.getUser(); // Retrieve the current user
  const requiredInit = route.data['requiredInit']; // Get `requiredInit` metadata from route
  const queryParams = new URLSearchParams(state.url.split('?')[1]);

  // Redirect to login if the user is not authenticated
  if (!user) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Redirect to cart if `requiredInit` is specified but `init` parameter is missing
  if (requiredInit && !queryParams.has('init') && queryParams.get('init') !== 'view=FLIPKART') {
    router.navigate(['/viewcart']);
    return false;
  }

  return true; // Allow access if all checks pass
};