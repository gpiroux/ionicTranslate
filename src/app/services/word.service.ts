import { Injectable } from '@angular/core';

import { AngularFirestore, CollectionReference, DocumentChangeAction } from '@angular/fire/firestore';
import { Word, WordJson } from 'src/app/models/word.model';

import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, switchMap, take, takeLast, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash'

import { data } from 'data.js';

export enum FilterType {
  en = 'en',
  enSearch = 'enSearch',
  random = 'random'
}

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private _search$: BehaviorSubject<string|null>;
  private _random$: BehaviorSubject<string|null>;
  private _words$: Observable<Word[]>;
  private _searchedWords$: Observable<Word[]>;
  private _randomWords$: Observable<Word[]>;

  private _lastKey: number;
  private _lastWords: Word[];

  private _isFilterRandom: boolean = false;

  private randomCount: number = 6;
  private searchCount: number = 50;
  private wordsCount: number = 100;

  private destroy$: Subject<void> = new Subject();

  selectedWord: Word;

  constructor(private firestore: AngularFirestore) {
    this._search$ = new BehaviorSubject(null);
    this._random$ = new BehaviorSubject(null);

    // Last key used
    this.firestore.collection<Word>('words', ref => ref.orderBy('key', 'desc').limit(1))
      .snapshotChanges()
      .pipe(
        map(actions => {
          console.log('_lastKey$', actions.length)
          return actions.map(a => a.payload.doc.data().key)[0]
        }),
        takeUntil(this.destroy$)
      ).subscribe(keys => this._lastKey = keys);

    this._words$ = this.firestore.collection<Word>('words', ref => ref.orderBy('date', 'desc').limit(this.wordsCount))
      .snapshotChanges()
      .pipe(map(actions => {
        console.log('_words$', actions.length)
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return new Word({ id, ...data });
        })
    }));

    this._randomWords$ = this._random$.pipe(
      switchMap(() => {
        return this.firestore.collection<Word>('words', this.filterEnRandom(this._lastKey, this))
          .snapshotChanges()
          .pipe(map(actions => {
            console.log('_randomWords$', actions.length)
            return this.mapToWords(actions)
          })); 
      })
    )

    this._searchedWords$ = this._search$.pipe(
      switchMap(_search => {
        const search = (_search || '').trim();
        const len = search.length;
        let querySearch = search;
        const nakedSearch = search.replace(/[\^\$]/g, '');

        if (search[0] === '^' && search[len-1] === '$') {
          querySearch = search
        } else if (search[0] === '^') {
          querySearch = search.length > 5 ? search.substr(0, 5) : querySearch = search;
        } else if (search[len-1] === '$') {
          querySearch = search.length > 5 ? search.substr(len-5, 5) : querySearch = search;
        } else if (search.length > 4) {
          querySearch = search.substr(0, 4);
        } else {
          querySearch = search;
        }

        console.log('search', querySearch, nakedSearch)
        return this.firestore.collection<Word>('words', this.filterEnSearch(querySearch, this))
          .snapshotChanges()
          .pipe(map(actions => {
            console.log('_searchedWords$', actions.length)
            const words = this.mapToWords(actions);
            return _(words)
              .filter(w => w.en.includes(nakedSearch))
              .orderBy(w => w.en.split(' ')[0])
              .orderBy(w => _.find(w.en.split(' '), sw => sw === nakedSearch))
              .value();
          }));  
      })
    )
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mapToWords(actions: DocumentChangeAction<Word>[]) {
    return _.map(actions, a => {
      const data = a.payload.doc.data();
      const id = a.payload.doc.id;
      return new Word({ id, ...data });
    });
  }

  private filterEn(search: string, self: WordService): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref => ref.where('en', '>=', search).where('en', '<', `${search}\uf8ff`).orderBy('en').limit(self.searchCount)
  }

  private filterEnSearch(search: string, self: WordService): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref => ref.where('search', 'array-contains', search).limit(self.searchCount)  // Index issue =>  .orderBy('en')
  }

  private filterEnRandom(lastKey: number, self: WordService): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    let randomArray = _.range(10).map(() => Math.ceil(Math.random() * (lastKey || 0)))
    console.log(randomArray)
    return ref => ref.where('key', 'in', randomArray).limit(self.randomCount)
  }

  get isFilterRandom() {
    return this._isFilterRandom;
  }
  set isFilterRandom(val) {
    this._isFilterRandom = val;
  }

  get words$() {
    return this._words$;
  }

  get searchedWords$() {
    return this._searchedWords$;
  }

  get search$() {
    return this._search$;
  }

  get randomWords$() {
    return this._randomWords$;
  }

  get random$() {
    return this._random$;
  }

  get displayedWords() {
    return this._lastWords;
  }
  set displayedWords(val) {
    this._lastWords = val
  }

  createWord(word: Word) {
    word.updateTimestamp();
    word.generateSearchStrings();
    word.key = this._lastKey + 1
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
    console.log('data', data);
    let i = 0
    this.words$.pipe(take(1)).subscribe((words: Word[]) => {
      console.log('words', words);
      _.reduce(data as WordJson[], (acc, d) => 
        acc.then(async () => {
          if (!d.key) d.key = this._lastKey + 1;
          const findedWord = _.find(words, w => w.key === d.key)
          if (findedWord) return
          let word = new Word();
          word.initJson(d);
          word.generateSearchStrings();
          console.log('add', i++ ,word)
          await this.firestore.collection<Word>('words').add(word.clean() as Word).catch(err => console.log('ERROR:', err));
        }), Promise.resolve())
    });
  }
}
