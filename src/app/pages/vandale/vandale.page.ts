import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { VanDaleService } from 'src/app/services/vandale.service';
import { WordService } from 'src/app/services/word.service';
import { NotificationsService } from 'src/app/services/notifications.service';

import { Word } from 'src/app/models/word.model';
import { DicoWord, Traduction } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash';

@Component({
  selector: 'app-vandale',
  templateUrl: './vandale.page.html',
  styleUrls: ['./vandale.page.scss'],
  encapsulation: ViewEncapsulation.None, // For <mark></madk> style
})
export class VandalePage implements OnInit {
  selectedWord: Word;
  wordTraductions: DicoWord[];

  constructor(
    private vandaleService: VanDaleService,
    private wordService: WordService,
    private notification: NotificationsService
  ) {}

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
    this.vandaleService
      .load(href, true)
      .then(result => {
        this.wordTraductions = result.dicoWords;
        console.log('wordTraductions', this.wordTraductions);
      })
      .catch(err => {
        console.error(err);
        this.notification.error(err.message || err);
        this.wordTraductions = []; 
      });
  }

  onWordClick(word: DicoWord) {
    this.selectedWord.en = `${word.en} ${word.phonetique} ${word.formeFlechie}`.trim();
  }

  onTraductionClick(traduction: Traduction) {
    if (traduction.traductionSubList.length || traduction.locution) return;
    const frSplit = _.map(this.selectedWord.fr.split(','), s => s.trim());
    const tradSplit = _.map([traduction.indicateur, traduction.traduction].join('').split(','), s => s.trim());
    _.forEach(tradSplit, t => {
      if (frSplit.includes(t)) return;
      frSplit.push(t);
    });
    this.selectedWord.fr = _.compact(frSplit).join(', ');
  }
}
