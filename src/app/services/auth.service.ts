import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import * as firebase from 'firebase';
import * as _ from 'lodash';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  _user: firebase.User;

  running: boolean;

  constructor(
    public fireauth: AngularFireAuth,
    private firestore: AngularFirestore,
    private notifications: NotificationsService
  ) {
    this.fireauth.user.subscribe((user) => {
      console.log('fireauth.user.subscribe', user);
      this._user = user;

      //this.migrateData();
    });

    //
    // Persistance and cache management
    //
    this.firestore.firestore.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    });
    this.firestore.firestore
      .enablePersistence({ synchronizeTabs: true })
      .then(() => console.log('Enable persistence OK'))
      .catch((err) => {
        this.notifications.error('Enable persistence KO: ' + err.message || err);
        console.error('enablePersistence KO', err);
      });
  }

  async migrateData() {
    if (this.running) return;
    this.running = true;

    // const userDoc = await this.getUserDoc()
    // userDoc.collection('dicoEn').get().toPromise()
    //   .then(data => {
    //     data.forEach(d => {
    //       console.log(d.data())
    //       this.firestore.collection('users').doc('mERRayYWGhXpd7DplIknACkQO6i1').collection('dicoEn').add(d.data());
    //     })
    //   });

    // this.firestore.collection('users').doc('mERRayYWGhXpd7DplIknACkQO6i1').collection('dicoEn').get().toPromise()
    //   .then(data => console.log('data size', data.size))
    //   .catch(err => console.error(err))
  }

  get user$() {
    return this.fireauth.user;
  }

  async getUserDoc(): Promise<AngularFirestoreDocument> {
    const uid = _.get(this._user, 'uid');
    if (!uid) return null;
    return this.firestore.collection('users').doc(uid);
  }
}
