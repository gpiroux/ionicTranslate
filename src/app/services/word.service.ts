import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { Word, WordJson } from 'src/app/models/word.model';

import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import * as _ from 'lodash'



@Injectable({
  providedIn: 'root'
})
export class WordService {
  private _search$: BehaviorSubject<string|null>;
  private _words$: Observable<Word[]>;
  private _searchedWords$: Observable<Word[]>;
  
  selectedWord: Word;

  constructor(private firestore: AngularFirestore) {}

  init() {
    this._search$ = new BehaviorSubject(null);
    
    this._words$ = this.firestore.collection<Word>('words', ref => ref.orderBy('date', 'desc').limit(100))
      .snapshotChanges()
      .pipe(map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data } as Word;
      })));

    this._searchedWords$ = this._search$.pipe(
      switchMap(search => {
        if (!search) {
          console.log('Search field empty');
          return this._words$;
        }
        return this.firestore.collection<Word>('words', ref => ref.where('en', '>=', search).where('en', '<', `${search}\uf8ff`).orderBy('en').limit(25))
          .snapshotChanges()
          .pipe(map(actions => actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data } as Word;
          })));
      })
    )
  }

  get words$() {
    return this._searchedWords$;
  }

  get search$() {
    return this._search$;
  }

  createWord(word: Word) {
    return this.firestore.collection<Word>('words').add({...word});
  }
  
  updateWord(word: Word) {
    Word.updateTimestamp(word);
    return this.firestore.doc<Word>(`words/${word.id}`).update(word);
  }

  deleteWord(id: string) {
    return this.firestore.doc<Word>(`words/${id}`).delete();
  }

  async generateDatabase() {
    // import { data } from 'data.js';
    //
    // console.log('data', data);
    // let i = 0
    // this.words$.pipe(take(1)).subscribe((words: Word[]) => {
    //   console.log('words', words);
    //   _.reduce(data as WordJson[], (acc, d) => 
    //     acc.then(async () => {
    //       const findedWord = _.find(words, w => w.key === d.key)
    //       if (findedWord) return
    //       let word = new Word(d);
    //       this.generateSearchStrings(word);
    //       console.log('add', i++ ,word)
    //       await this.createWord(word).catch(err => console.log('ERROR:', err));
    //     }), Promise.resolve())
    // });
  }

  generateSearchStrings(word: Word|WordJson) {
    word.search = []
    let split = _(word.en.split('[')[0].split(' '))
      .compact()
      .map(s => s.replace(',', ''))
      .filter(s => s.length >= 3)
      .value()

    _.forEach(split, s => {
      _.forEach([3,4], len => {
        if (s.length >= len )
          for (let i = 0; i < s.length - len + 1; i++) 
            word.search.push(s.substr(i, len));
      })
    })
    return word;
  }
}
