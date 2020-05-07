import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

import * as firebaseUi from 'firebaseui';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  ui: firebaseUi.auth.AuthUI;
  _user: firebase.User;
  _userId: string

  constructor(
    public fireauth: AngularFireAuth,
    private firestore: AngularFirestore,
    private notifications: NotificationsService
  ) { 
    this.fireauth.user.subscribe(user => {
      console.log('fireauth.user.subscribe', user);
      this._user = user;
    });

    //
    // Persistance and cache management
    //
    this.firestore.firestore.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    this.firestore.firestore.enablePersistence()
      .then(() => console.log('enablePersistence OK'))
      .catch(err => {
        this.notifications.error('enablePersistence KO')
        console.log('enablePersistence KO', err)
      });
  }

  get user$() {
    return this.fireauth.user;
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
