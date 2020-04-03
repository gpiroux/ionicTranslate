import { Injectable } from '@angular/core';

import { AngularFirestore, CollectionReference } from '@angular/fire/firestore';
import { Word, WordJson } from 'src/app/models/word.model';

import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import * as _ from 'lodash'

import { data } from 'data.js';

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private _search$: BehaviorSubject<string|null>;
  private _words$: Observable<Word[]>;
  private _searchedWords$: Observable<Word[]>;
  
  selectedWord: Word;

  constructor(private firestore: AngularFirestore) {
    //this.init()
  }

  init() {
    this._search$ = new BehaviorSubject(null);

    this._words$ = this.firestore.collection<Word>('words', ref => ref.orderBy('date', 'desc').limit(50))
      .snapshotChanges()
      .pipe(map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return new Word({ id, ...data });
      })));

    this._searchedWords$ = this._search$.pipe(
      switchMap(search => {
        if (!search || search.length < 3) {
          console.log('Search field empty');
          return this._words$;
        }
        return this.firestore.collection<Word>('words', this.filterArray(search))
          .snapshotChanges()
          .pipe(map(actions => actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return new Word({ id, ...data });
          })));
      })
    )
  }

  private filter(search: string): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref => ref.where('en', '>=', search).where('en', '<', `${search}\uf8ff`).orderBy('en').limit(25)
  }

  private filterArray(search: string): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref => ref.where('search', 'array-contains', search).orderBy('en').limit(25)
  }

  get words$() {
    return this._searchedWords$;
  }

  get search$() {
    return this._search$;
  }

  createWord(word: Word) {
    word.updateTimestamp();
    word.generateSearchStrings();
    return this.firestore.collection<Word>('words').add(word.clean() as Word);
  }
  
  updateWord(word: Word) {
    word.updateTimestamp();
    word.generateSearchStrings();
    return this.firestore.doc<Word>(`words/${word.id}`).update(word.clean() as Word);
  }

  deleteWord(id: string) {
    return this.firestore.doc<Word>(`words/${id}`).delete();
  }

  async generateSearchArray(words_: Word[]) {    
    let i = 0
    console.log('words', words_);
    const words = _.cloneDeep(words_)
    _.reduce(words, (acc, word) => 
      acc.then(async () => {
        word.generateSearchStrings();
        console.log('update', i++ ,word)
        await this.firestore.doc<Word>(`words/${word.id}`)
          .update(word.clean() as Word)
          .catch(err => console.log('ERROR:', err));
      }), Promise.resolve())
  }

  async generateDatabase() {
    return;
    console.log('data', data);
    let i = 0
    this.words$.pipe(take(1)).subscribe((words: Word[]) => {
      console.log('words', words);
      _.reduce(data as WordJson[], (acc, d) => 
        acc.then(async () => {
          const findedWord = _.find(words, w => w.key === d.key)
          if (findedWord) return
          let word = new Word();
          word.initJson(d);
          word.generateSearchStrings();
          console.log('add', i++ ,word)
          await this.createWord(word).catch(err => console.log('ERROR:', err));
        }), Promise.resolve())
    });
  }
}
