import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import * as firebaseUi from 'firebaseui';
import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  ui: firebaseUi.auth.AuthUI;
  _user: firebase.User;

  constructor(public afAuth: AngularFireAuth) { 
    this.ui = new firebaseUi.auth.AuthUI(firebase.auth());

    this.afAuth.user.subscribe(user => {
      console.log('afAuth.user.subscribe', user);
      this._user = user;
    })
  }

  get user$() {
    return this.afAuth.user;
  }

  get user() {
    return this._user;
  }

  doGoogleLogin(){
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      return this.afAuth.auth
        .signInWithPopup(provider)
        .then(res => {
          // save current user
        })
    })
  }

  doSignUp() {
    const self = this
    this.ui.start('#firebaseui-auth-container', {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          self._user = authResult.user;
          return true;
        },
      },
      signInFlow: 'popup',
      signInSuccessUrl: '/folder',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
    });
  }

  doSignOut() {
    console.log('Signout', this.user && this.user.uid);
    firebase.auth().signOut();
  }
}
