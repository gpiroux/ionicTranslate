import { Injectable, OnDestroy } from '@angular/core';

import {
  CollectionReference,
  DocumentChangeAction,
  AngularFirestoreDocument,
  DocumentReference,
} from '@angular/fire/compat/firestore';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { Word } from 'src/app/models/word.model';

import { Observable, BehaviorSubject, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import _ from 'lodash';

import { AuthService } from './auth.service';

export enum FilterType {
  en = 'en',
  enSearch = 'enSearch',
  random = 'random',
}

export interface Dico {
  title: string;
  collection: string;
  dico: DicoWebsite;
}
export interface DicoList {
  [key: string]: Dico;
}

export enum DicoWebsite {
  Larousse,
  Vandale,
}

export const dicoList: DicoList = {
  dicoEn: {
    title: 'Dico En',
    collection: 'dicoEn',
    dico: DicoWebsite.Larousse,
  },
  dicoNL: {
    title: 'Dico NL',
    collection: 'dicoNL',
    dico: DicoWebsite.Vandale,
  },
};

export interface SearchQuery {
  querySearch: string; // value matched against the `search` array in Firestore
  nakedSearch: string; // user search without ^ and $ anchors, used to filter results
}

/**
 * Builds the Firestore query string from the user search.
 * `^` anchors on the start of a word, `$` on the end; queries are capped to the
 * 4 (or 5 with an anchor) characters stored by Word.generateSearchStrings().
 */
export function buildSearchQuery(rawSearch: string | null): SearchQuery {
  const search = (rawSearch || '').trim();
  const len = search.length;
  let querySearch: string;
  const nakedSearch = search.replace(/[\^\$]/g, '');

  if (search[0] === '^' && search[len - 1] === '$') {
    querySearch = search;
  } else if (search[0] === '^') {
    querySearch = search.length > 5 ? search.slice(0, 5) : search;
  } else if (search[len - 1] === '$') {
    querySearch = search.length > 5 ? search.slice(-5) : search;
  } else if (search.length > 4) {
    querySearch = search.slice(0, 4);
  } else {
    querySearch = search;
  }

  return { querySearch, nakedSearch };
}

/**
 * Keeps the words containing `nakedSearch`, sorted by first word, with the
 * words containing `nakedSearch` as a whole word first.
 */
export function filterSearchResults(words: Word[], nakedSearch: string): Word[] {
  return _(words)
    .filter(w => w.en.includes(nakedSearch))
    .orderBy(w => w.en.split(' ')[0])
    .orderBy(w => _.find(w.en.split(' '), sw => sw === nakedSearch))
    .value();
}

@Injectable()
export class WordService implements OnDestroy {
  private _category$ = new BehaviorSubject<string | null>(null);
  private _search$ = new BehaviorSubject<string | null>(null);
  private _random$ = new BehaviorSubject<string | null>(null);

  // Assigned in initialise()
  private _words$!: Observable<Word[]>;
  private _searchedWords$!: Observable<Word[]>;
  private _randomWords$!: Observable<Word[]>;

  private _lastWords: Word[] = [];

  private randomCount: number = 6;
  private searchCount: number = 50;
  private wordsCount: number = 100;

  private _categoryFilter: string | null = null;
  private dicoCollection!: string;
  public selectedWord!: Word;
  public userDoc!: AngularFirestoreDocument;

  public categories = ['other', 'book', 'lyrics', 'travel', 'guitare', 'tech', 'conv', 'net', 'Caving', 'check'];

  constructor(private auth: AuthService) {}

  async initialise(dico: Dico) {
    this.dicoCollection = dico.collection;
    console.log('initialise', this.dicoCollection);

    this.userDoc = await this.auth.getUserDoc();
    if (!this.userDoc) {
      this.dicoCollection = '';
      throw new Error('No user found!');
    }
    console.log('userDoc', this.userDoc.ref.path);

    this._words$ = this._category$.pipe(
      switchMap(category => {
        return this.userDoc
          .collection<Word>(this.dicoCollection, this.wordQuery(category, this))
          .snapshotChanges()
          .pipe(
            tap({
              next: actions => console.log('snapshot next', category, actions.length),
              error: err => console.error('snapshot error', category, err),
            }),
            map(actions => {
              console.log('_words$', category, actions.length);
              return this.mapToWords(actions);
            }),
            catchError(err => {
              console.error('words$ pipeline failed', err);
              return of([]); // allow template to keep running
            })
          );
      })
    );

    this._randomWords$ = this._random$.pipe(
      switchMap(() => this.getLastKey()),
      switchMap(lastKey => {
        return this.userDoc
          .collection<Word>(this.dicoCollection, this.filterEnRandom(lastKey, this))
          .snapshotChanges()
          .pipe(
            map(actions => {
              console.log('_randomWords$', actions.length);
              return this.mapToWords(actions);
            })
          );
      })
    );

    this._searchedWords$ = this._search$.pipe(
      switchMap(_search => {
        const { querySearch, nakedSearch } = buildSearchQuery(_search);

        console.log('search', querySearch, nakedSearch);
        return this.userDoc
          .collection<Word>(this.dicoCollection, this.filterEnSearch(querySearch, this))
          .snapshotChanges()
          .pipe(
            map(actions => {
              console.log('_searchedWords$', actions.length);
              return filterSearchResults(this.mapToWords(actions), nakedSearch);
            })
          );
      })
    );
  }

  ngOnDestroy() {}

  private mapToWords(actions: DocumentChangeAction<Word>[]) {
    return _.map(actions, a => {
      const data = a.payload.doc.data();
      const id = a.payload.doc.id;
      return new Word({ ...data, id });
    });
  }

  private filterEn(
    search: string,
    self: WordService
  ): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref =>
      ref.where('en', '>=', search).where('en', '<', `${search}\uf8ff`).orderBy('en').limit(self.searchCount);
  }

  private wordQuery(
    category: string | null,
    self: WordService
  ): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    if (category) {
      return ref => ref.where('category', 'array-contains', category).orderBy('date', 'desc').limit(self.wordsCount);
    }
    return ref => ref.orderBy('date', 'desc').limit(self.wordsCount);
  }

  private filterEnSearch(
    search: string,
    self: WordService
  ): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    return ref => ref.where('search', 'array-contains', search).limit(self.searchCount); // Index issue =>  .orderBy('en')
  }

  private filterEnRandom(
    lastKey: number,
    self: WordService
  ): (ref: CollectionReference) => firebase.firestore.Query<firebase.firestore.DocumentData> {
    let randomArray = _.range(10).map(() => Math.ceil(Math.random() * (lastKey || 0)));
    console.log(randomArray);
    return ref => ref.where('key', 'in', randomArray).limit(self.randomCount);
  }

  getLastKey() {
    return this.userDoc
      .collection<Word>(this.dicoCollection, ref => ref.orderBy('key', 'desc').limit(1))
      .get()
      .pipe(
        map(res => {
          const doc = res.docs[0];
          return doc ? doc.data().key : 0;
        })
      );
  }

  async createWord(word: Word): Promise<DocumentReference> {
    const lastKey = await lastValueFrom(this.getLastKey());
    word.updateTimestamp();
    word.generateSearchStrings();
    word.key = lastKey + 1;
    return this.userDoc.collection<Word>(this.dicoCollection).add(word.clean() as Word);
  }

  async updateWord(word: Word): Promise<void> {
    word.updateTimestamp();
    word.generateSearchStrings();
    return this.userDoc
      .collection<Word>(this.dicoCollection)
      .doc(word.id)
      .update(word.clean() as Word);
  }

  async deleteWord(id: string): Promise<void> {
    return this.userDoc.collection<Word>(this.dicoCollection).doc(id).delete();
  }

  get words$() {
    return this._words$;
  }

  get searchedWords$() {
    return this._searchedWords$;
  }

  get category$() {
    return this._category$;
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
    this._lastWords = val;
  }

  get categoryFilter() {
    return this._categoryFilter;
  }

  set categoryFilter(val: string | null) {
    this._categoryFilter = val;
  }
}
