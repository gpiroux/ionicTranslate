import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { NotificationsService } from '../services/notifications.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth, 
    private router: Router,
    private notifications: NotificationsService
  ) {}
  
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {

      console.log('CanActivate logout guard !')
      return this.afAuth.auth.signOut()
        .then(() => {
          console.log('logout sucess')
          return this.router.navigateByUrl('/login')
        })
        .catch(err => {
          this.notifications.error(err.message || err)
          return false;
        });
  }
  
}
