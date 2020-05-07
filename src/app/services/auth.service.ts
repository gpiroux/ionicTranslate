import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, CollectionReference, DocumentChangeAction } from '@angular/fire/firestore';

import * as firebaseUi from 'firebaseui';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  ui: firebaseUi.auth.AuthUI;
  _user: firebase.User;
  _userId: string

  constructor(
    public afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
  ) { 
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

  async getUserId(): Promise<string> {
    // Is there a connected user ?    
    const uid = _.get(this._user, 'uid');
    if (!uid) return;
    
    const user = await this.firestore.collection('users', ref => ref.where('uid', '==', uid)).get().toPromise();
    if (!user.docs[0]) return

    return this._userId = _.get(user, 'docs.0.id', null);
  }

  async getUserDoc() {
    const userId = await this.getUserId();
    if (!userId) return null;
    return this.firestore.collection('users').doc(userId);
  }
}
