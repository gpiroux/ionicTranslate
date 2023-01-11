import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Platform, AlertController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Deploy } from 'cordova-plugin-ionic/dist/ngx';

import { AuthService } from './services/auth.service';
import { NotificationsService } from './services/notifications.service';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import * as _ from 'lodash';
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
  public progress: number = null;
  public version: string;
  public isCordova: boolean;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private location: Location,
    private router: Router,
    private deploy: Deploy,
    private auth: AuthService,
    private notificationService: NotificationsService,
    private alertController: AlertController
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
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.checkForUpdate(true);

      this.isCordova = this.platform.is('cordova');
    });
  }

  checkForUpdate(silentMode: boolean = false) {
    this.deploy
      .checkForUpdate()
      .then(response => {
        if (response.available) {
          return this.openUpdateAppAlert();
        }
        if (silentMode) return;
        const message = 'No update available';
        const header = 'Check for update';
        return this.notificationService.message(message, header);
      })
      .catch(err => {
        this.notificationService.error(err.message || err);
      });
  }

  async openUpdateAppAlert() {
    const alert = await this.alertController.create({
      header: 'Check for update',
      message: 'Update available',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Install',
          handler: () => this.updateApp(),
        },
      ],
    });
    await alert.present();
  }

  async updateApp() {
    this.progress = 0;
    await this.deploy.downloadUpdate(progress => {
      this.progress = progress / 100;
    });
    await this.deploy.extractUpdate(progress => {
      this.progress = progress / 100;
    });
    await this.deploy.reloadApp();
  }
}
