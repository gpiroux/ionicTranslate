import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

import { Word } from 'src/app/models/word.model';
import { DicoWord } from 'src/app/models/dicoResult.model';

import { LarousseService } from 'src/app/services/larousse.service';
import { WordService } from 'src/app/services/word.service';

import * as _ from 'lodash'

@Component({
  selector: 'app-larousse',
  templateUrl: './larousse.page.html',
  styleUrls: ['./larousse.page.scss'],
})
export class LaroussePage implements OnInit {

  selectedWord: Word;
  wordTraductions: DicoWord[];
  constructor(
    private larousseService: LarousseService, 
    private alertController: AlertController,
    private wordService: WordService
  ) { }

  async ngOnInit() {
    const selectedWord = _.get(this.wordService.selectedWord, 'en');
    if (selectedWord)
      this.load(selectedWord);
    else {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Pas de mot sélectionné !',
        buttons: ['OK']
      });    
      await alert.present();
    }
  }

  async load(word: string) {
    this.larousseService.load(word)
      .then(traductions => {
        this.wordTraductions = traductions
        console.log(traductions)
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
}
