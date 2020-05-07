import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AuthService } from './services/auth.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      hidden: false,
      title: 'Login',
      url: '/login',
      icon: 'log-in'
    },
    {
      hidden: false,
      title: 'Dico En',
      url: '/folder/dicoEn',
      icon: 'documents'
    },
    {
      hidden: false,
      title: 'Dico NL',
      url: '/folder/dicoNl',
      icon: 'document-text'
    },
    {
      hidden: false,
      title: 'Logout',
      url: '/logout',
      icon: 'log-out'
    }
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  
  public user: firebase.User;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private auth: AuthService,
    private location: Location, 
    private router: Router,
  ) {
    this.initializeApp();

    this.auth.user$.subscribe(user => {
      const loginPage = _.find(this.appPages, p => p.title === 'Login')
      const logoutPage = _.find(this.appPages, p => p.title === 'Logout')
      loginPage.hidden = !!user;
      logoutPage.hidden = !user;
      this.user = user;
    })

    this.router.events.subscribe(val => {
      if (this.location.path()) {
        const path = this.location.path();
        this.selectedIndex = 
          _.findIndex(this.appPages, p => path.toLowerCase().includes(p.url.toLowerCase()));
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {}
}
