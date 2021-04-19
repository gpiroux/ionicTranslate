import { Component, OnInit } from '@angular/core';
import { Word } from 'src/app/models/word.model';
import { DicoWord, Traduction } from 'src/app/models/dicoResult.model';
import { NotificationsService } from 'src/app/services/notifications.service';
import { WordService } from 'src/app/services/word.service';
import { ReversoService } from 'src/app/services/reverso.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-revesro',
  templateUrl: './revesro.page.html',
  styleUrls: ['./revesro.page.scss'],
})
export class RevesroPage implements OnInit {
  selectedWord: Word;
  wordTraductions: DicoWord[];

  constructor(
    private reversoService: ReversoService,
    private wordService: WordService,
    private notification: NotificationsService
  ) {}

  ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWord = _.get(this.selectedWord, 'en');

    if (selectedWord) {
      let strippedWord = selectedWord.trim().split(' ')[0].split('[')[0];
      this.load(`neerlandais-francais/${strippedWord}`);
    } else {
      this.notification.error('Pas de mot sélectionné !');
    }
  }

  async load(href: string) {
    this.reversoService
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
    if (traduction.subExpressions.length || traduction.locution) return;
    const frSplit = _.map(this.selectedWord.fr.split(','), s => s.trim());
    const tradSplit = _.map(traduction.traduction.split(','), s => s.trim());
    _.forEach(tradSplit, t => {
      if (frSplit.includes(t)) return;
      frSplit.push(t);
    });
    this.selectedWord.fr = _.compact(frSplit).join(', ');
  }
}
