import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/compat/auth';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginError: string;
  constructor(
    private fireauth: AngularFireAuth,
    private router: Router,
    private notification: NotificationsService,
    public ngZone: NgZone
  ) {}

  ngOnInit() {}

  signInWithEmailAndPassword(email, password) {
    return this.fireauth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigateByUrl('');
      })
      .catch(err => {
        console.error(err);
        this.notification.error(err.message)
      });
  }

  sendResetPawword(email: string) {
    return this.fireauth.sendPasswordResetEmail(email);
  }

  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider(); 
    provider.addScope('profile');
    provider.addScope('email');
    return this.fireauth
      .signInWithPopup(provider)
      .then(() => {
        this.ngZone.run(() => this.router.navigateByUrl(''));
      })
      .catch(err => this.notification.error(err.message));
  }
}
