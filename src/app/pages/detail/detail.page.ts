import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { Word } from 'src/app/models/word.model';
import { WordService } from 'src/app/services/word.service';
import { zip } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
  
  word: Word = new Word();
  newWord: Word = new Word();
  hasChanged: boolean;

  typeOptions = [
    'noun',
    'verb',
    'adverb',
    'adjective',
    'expression',
    'conjunction',
    'interjection'
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
    private wordService: WordService,
    private location: Location
  ) {}

  ngOnInit() {

    zip(this.route.params, this.wordService.words$)
      .pipe(take(1))
      .subscribe(([parms, words]) => {
        this.word = words.find(w => w.id === parms.id);
        this.newWord = _.cloneDeep(this.word);
      });
  }

  async onSave(): Promise<void> {
    await this.wordService.updateWord(this.newWord);
  }

  test(test) {
    console.log(test)
  }
}
