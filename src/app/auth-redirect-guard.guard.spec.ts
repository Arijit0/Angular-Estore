import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authRedirectGuardGuard } from './auth-redirect-guard.guard';

describe('authRedirectGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authRedirectGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
