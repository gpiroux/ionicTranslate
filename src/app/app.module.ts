import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { File } from '@ionic-native/file/ngx';
import { Deploy } from 'cordova-plugin-ionic/dist/ngx';

import { PipesModule } from './pipes/pipe.module';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { FileSystemService } from './services/file-system.service';
import { AuthService } from './services/auth.service';
import { WordService } from './services/word.service';

@NgModule({
  declarations: [
    AppComponent, 
  ],
  entryComponents: [],
  imports: [
    HttpClientModule,
    FormsModule,
    BrowserModule,
    PipesModule,
    AppRoutingModule,
    IonicModule.forRoot({ mode: 'md' }),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
  ],
  providers: [
    HTTP,
    File,
    Deploy,
    StatusBar,
    SplashScreen,
    AlertController,
    AngularFirestore,
    AngularFireAuth,
    AuthService,
    WordService,
    FileSystemService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
