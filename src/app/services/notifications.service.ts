import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  
  constructor(
    private alertController: AlertController
  ) { }

  async error(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });    
    await alert.present();
  }

  async message(message: string, header = '') {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });    
    await alert.present();
  }
}
