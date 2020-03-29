import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { take } from 'rxjs/operators';
import { zip } from 'rxjs';
import * as _ from 'lodash';

import { Word } from 'src/app/models/word.model';
import { WordService } from 'src/app/services/word.service';
import { DicoWord } from 'src/app/models/dicoResult.model';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
  traductions: DicoWord[];
  newWord: Word = new Word();
  hasChanged: boolean;

  typeOptions = [
    'noun',
    'verb',
    'adverb',
    'adjective',
    'expression',
    'conjunction',
    'interjection',
    'preposition',
    'conjunciton'
  ]

  categoryOptions = [
    'other',
    'novel',
    'conv',
    'net',
    'lyrics',
    'check',
    'Caving',
    'Collins',
    'XP',
    'ESL',
  ]

  constructor(
    private route: ActivatedRoute,
    private wordService: WordService
  ) {}

  ngOnInit() {

    zip(this.route.params, this.wordService.words$)
      .pipe(take(1))
      .subscribe(([parms, words]) => {
        let word = words.find(w => w.id === parms.id);
        this.newWord = _.cloneDeep(word);
        this.wordService.selectedWord = this.newWord;
      });
  }

  async onSave(): Promise<void> {
    await this.wordService.updateWord(this.newWord);
  }


}
