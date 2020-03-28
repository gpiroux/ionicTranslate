import { Component, OnInit } from '@angular/core';
import { Word } from 'src/app/models/word.model';

@Component({
  selector: 'app-larousse',
  templateUrl: './larousse.page.html',
  styleUrls: ['./larousse.page.scss'],
})
export class LaroussePage implements OnInit {

  url: string =  'http://www.larousse.fr/dictionnaires/anglais-francais/';

  constructor() { }

  ngOnInit() {
  }
  
  private stripWord(word: Word) {
    return  (word.en || '').split(' ')[0].split('[')[0];
  }
}
