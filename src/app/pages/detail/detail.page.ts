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
  newWord: Word;
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
    private activatedRoute: ActivatedRoute,
    private wordService: WordService
  ) {
    // html page initialwed before ngOnInit()
    this.newWord = new Word();
  }

  ngOnInit() {

    // fix me 
    const wordId = this.activatedRoute.snapshot.paramMap.get('wordId');
    const searchString = this.activatedRoute.snapshot.paramMap.get('searchString');
    const lastWords = this.wordService.lastWords;

    if (wordId) {
      let word = lastWords.find(w => w.id === wordId);
      this.newWord = _.cloneDeep(word);
    } else {
      this.newWord = new Word()
      this.newWord.en = (searchString || '').toLowerCase()
      this.newWord.fr = '';
    }
    this.wordService.selectedWord = this.newWord;
    console.log(this.newWord)
  }

  async onSave(): Promise<void> {
    if (this.newWord.id) {
      await this.wordService.updateWord(this.newWord);
    } else {
      await this.wordService.createWord(this.newWord);
    }
  }
}
