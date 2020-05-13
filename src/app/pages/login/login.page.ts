import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginError: string
  constructor(
    private fireauth: AngularFireAuth, 
    private platform: Platform, 
    private router: Router
  ) {}

  ngOnInit() {}

  signInWithEmailAndPassword(email, password){
    return this.fireauth.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigateByUrl('');
      })
      .catch(err => this.loginError = err.message)
  }

  sendResetPawword(email: string) {
    return this.fireauth.auth.sendPasswordResetEmail(email)
  }

  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return this.fireauth.auth.signInWithPopup(provider)
      .then(() => {
        this.router.navigateByUrl('');
      });
  }

}
