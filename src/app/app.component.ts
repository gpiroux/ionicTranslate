import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { AuthService } from './services/auth.service';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import _ from 'lodash';
import versionInfo from '../../version.json';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      hidden: false,
      title: 'Login',
      url: '/login',
      icon: 'log-in',
    },
    {
      hidden: false,
      title: 'Dico En',
      url: '/folder/dicoEn',
      icon: 'documents',
    },
    {
      hidden: false,
      title: 'Dico NL',
      url: '/folder/dicoNL',
      icon: 'document-text',
    },
    {
      hidden: false,
      title: 'Logout',
      url: '/logout',
      icon: 'log-out',
    },
  ];
  //public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  public user: firebase.User;
  public version: string;

  constructor(
    private platform: Platform,
    private location: Location,
    private router: Router,
    private auth: AuthService
  ) {
    this.initializeApp();

    this.auth.user$.subscribe(user => {
      const loginPage = _.find(this.appPages, p => p.title === 'Login');
      const logoutPage = _.find(this.appPages, p => p.title === 'Logout');
      loginPage.hidden = !!user;
      logoutPage.hidden = !user;
      this.user = user;
      document.title = !!user ? `Ionic Translate - ${user.email}` : `Ionic Translate`;
    });

    this.router.events.subscribe(val => {
      if (this.location.path()) {
        const path = this.location.path();
        this.selectedIndex = _.findIndex(this.appPages, p => path.toLowerCase().includes(p.url.toLowerCase()));
      }
    });

    this.version = versionInfo.version;
  }

  ngOnInit() {}

  initializeApp() {
    this.platform.ready().then(() => {
      if (Capacitor.isNativePlatform()) {
        void StatusBar.setStyle({ style: Style.Default }).catch(() => undefined);
        void SplashScreen.hide().catch(() => undefined);
      }
    });
  }
}
