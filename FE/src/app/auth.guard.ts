import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = localStorage.getItem('user');
    const requiresAuth = route.data['requiresAuth'];

    if (requiresAuth && user) {
      // User is logged in and access is allowed
      return true;
    } else if (!requiresAuth && !user) {
      // User is not logged in and access is allowed (for home page)
      return true;
    } else if (requiresAuth && !user) {
      // User is not logged in and access is denied for authenticated routes
      this.router.navigate(['/']);
      return false;
    } else {
      // User is logged in but trying to access the home page
      this.router.navigate(['/welcome']);
      return false;
    }
  }
}
