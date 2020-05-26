import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { NotificationsService } from '../services/notifications.service';

@Injectable({
  providedIn: 'root',
})
export class LogoutGuard implements CanActivate {
  constructor(private fireauth: AngularFireAuth, private router: Router, private notifications: NotificationsService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    console.log('CanActivate logout guard !');
    return this.fireauth.auth
      .signOut()
      .then(() => {
        console.log('logout sucess');
        this.router.navigateByUrl('/login');
        return false;
      })
      .catch((err) => {
        this.notifications.error(err.message || err);
        return false;
      });
  }
}
