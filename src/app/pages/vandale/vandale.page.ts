import { Component, OnInit } from '@angular/core';

import { VanDaleService } from 'src/app/services/vandale.service';
import { WordService } from 'src/app/services/word.service';
import { NotificationsService } from 'src/app/services/notifications.service';

import { Word } from 'src/app/models/word.model';
import { DicoWord } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash';

@Component({
  selector: 'app-vandale',
  templateUrl: './vandale.page.html',
  styleUrls: ['./vandale.page.scss'],
})
export class VandalePage implements OnInit {
  selectedWord: Word;
  wordTraductions: DicoWord[];

  constructor(    
    private vandaleService: VanDaleService, 
    private wordService: WordService,
    private notification: NotificationsService
  ) { }

  async ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWord = _.get(this.selectedWord, 'en');
    
    if (selectedWord) {
      let strippedWord = selectedWord.trim().split(' ')[0].split('[')[0];
      this.load(`gratis-woordenboek/nederlands-frans/vertaling/${strippedWord}`);
    } else {
      this.notification.error('Pas de mot sélectionné !');
    }
  }

  async load(href: string) {
    this.vandaleService.load(href)
      .then(result => {
        this.wordTraductions = result.dicoWords;
        console.log('wordTraductions', this.wordTraductions)
      })
      .catch(err => {
        this.notification.error(err.message || err);
      });
  }

}
