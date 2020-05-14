import { Injectable, OnDestroy } from '@angular/core';

import { CollectionReference, DocumentChangeAction, AngularFirestoreDocument, DocumentReference } from '@angular/fire/firestore';
import { Word } from 'src/app/models/word.model';

import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash'

import { AuthService } from './auth.service';

export enum FilterType {
  en = 'en',
  enSearch = 'enSearch',
  random = 'random'
}

export interface Dico {
  title: string,
  collection: string,
  dico: DicoWebsite
}
export interface DicoList { 
  [key: string]: Dico 
}

export enum DicoWebsite {
  Larousse,
  Vandale
}

export const dicoList: DicoList = {
  'dicoEn': {
    title: 'Dico En',
    collection: 'dicoEn',
    dico: DicoWebsite.Larousse
  },
  'dicoNL': {
    title: 'Dico NL',
    collection: 'dicoNL',
    dico: DicoWebsite.Vandale
  },
}

@Injectable()
export class WordService implements OnDestroy {
  private destroy$: Subject<void>;
  
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

  private dicoCollection: string;
  public selectedWord: Word;
  public userDoc: AngularFirestoreDocument;


  constructor(
    private auth: AuthService
  ) {
    this._search$ = new BehaviorSubject(null);
    this._random$ = new BehaviorSubject(null);
  }

  async initialise(dico: Dico) {
    this.destroy$ = new Subject();
    this.dicoCollection = dico.collection;
    const dicoCollection = this.dicoCollection;

    this.userDoc = await this.auth.getUserDoc();
    if (!this.userDoc) {
      this.dicoCollection = null;
      throw new Error('No user found!');
    }

    // Last key used
    this.userDoc.collection<Word>(dicoCollection, ref => ref.orderBy('key', 'desc').limit(1))
      .snapshotChanges()
      .pipe(
        map(actions => {
          console.log('_lastKey$', actions.length)
          return actions.map(a => a.payload.doc.data().key)[0]
        }),
        takeUntil(this.destroy$)
      ).subscribe(keys => this._lastKey = keys ||   0);

    this._words$ = this.userDoc.collection<Word>(dicoCollection, ref => ref.orderBy('date', 'desc').limit(this.wordsCount))
      .snapshotChanges()
      .pipe(map(actions => {
        console.log('_words$', actions.length)
        return this.mapToWords(actions);
    }));

    this._randomWords$ = this._random$.pipe(
      switchMap(() => {
        return this.userDoc.collection<Word>(dicoCollection, this.filterEnRandom(this._lastKey, this))
          .snapshotChanges()
          .pipe(map(actions => {
            console.log('_randomWords$', actions.length)
            return this.mapToWords(actions)
          })); 
      })
    );

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
        return this.userDoc.collection<Word>(dicoCollection, this.filterEnSearch(querySearch, this))
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

  reset() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnDestroy(): void {
    this.reset();
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

  createWord(word: Word): Promise<DocumentReference> {
    word.updateTimestamp();
    word.generateSearchStrings();
    word.key = this._lastKey + 1
    return this.userDoc.collection<Word>(this.dicoCollection).add(word.clean() as Word);
  }
  
  updateWord(word: Word): Promise<void> {
    word.updateTimestamp();
    word.generateSearchStrings();
    return this.userDoc.collection<Word>(this.dicoCollection).doc(word.id).update(word.clean() as Word);
  }

  deleteWord(id: string): Promise<void> {
    return this.userDoc.collection<Word>(this.dicoCollection).doc(id).delete();
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
}
