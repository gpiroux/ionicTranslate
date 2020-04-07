import { Component, OnInit } from '@angular/core';
import { AlertController, PopoverController } from '@ionic/angular';

import { Word } from 'src/app/models/word.model';
import { DicoWord, OtherTraduction } from 'src/app/models/dicoResult.model';

import { LarousseService } from 'src/app/services/larousse.service';
import { WordService } from 'src/app/services/word.service';

import * as _ from 'lodash'
import { OtherTraductionPopoverComponent } from './other-traduction-popover/other-traduction-popover.component';

@Component({
  selector: 'app-larousse',
  templateUrl: './larousse.page.html',
  styleUrls: ['./larousse.page.scss'],
})
export class LaroussePage implements OnInit {

  selectedWord: Word;
  wordTraductions: DicoWord[];
  otherTraductions: OtherTraduction[];

  private popover: any;

  constructor(
    private larousseService: LarousseService, 
    private alertController: AlertController,
    private wordService: WordService,
    private popoverController: PopoverController

  ) { }

  async ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWord = _.get(this.selectedWord, 'en');
    
    if (selectedWord) {
      let strippedWord = (selectedWord || '').trim().split(' ')[0].split('[')[0];
      this.load(`/dictionnaires/anglais-francais/${strippedWord}`);
    
    } else {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Pas de mot sélectionné !',
        buttons: ['OK']
      });    
      await alert.present();
    }
  }

  async load(href: string) {
    this.larousseService.load(href)
      .then(result => {
        this.wordTraductions = result.dicoWords;
        this.otherTraductions = result.otherTradutions;
        console.log(result)
      })
      .catch(async err => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: err.message || err,
          buttons: ['OK']
        });    
        await alert.present();
      });
  }

  async onOtherTraductionPopoverClick(ev: any) {
    this.popover = await this.popoverController.create({
      component: OtherTraductionPopoverComponent,
      componentProps: { 
        otherTraductionList: this.otherTraductions,
        dismiss: (link: string) => {
          this.wordTraductions = null;
          this.load(link);
          this.popover.dismiss();
        }
      },
      event: ev,
      translucent: true
    });
    return await this.popover.present();
  }
}
