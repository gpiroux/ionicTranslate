import { Component, OnInit } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginError: string
  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  ngOnInit() {}

  signInWithEmailAndPassword(email, password){
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigateByUrl('/folder');
      })
      .catch(err => this.loginError = err.message)
  }

  sendResetPawword(email: string) {
    return this.afAuth.auth.sendPasswordResetEmail(email)
  }

  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return this.afAuth.auth.signInWithPopup(provider)
      .then(() => {
        this.router.navigateByUrl('/folder');
      });
  }

}
