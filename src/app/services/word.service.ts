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

import { Observable, BehaviorSubject, lastValueFrom } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

@Injectable()
export class WordService implements OnDestroy {
  private _category$ = new BehaviorSubject<string | null>(null);
  private _search$ = new BehaviorSubject<string | null>(null);
  private _random$ = new BehaviorSubject<string | null>(null);

  private _words$: Observable<Word[]>;
  private _searchedWords$: Observable<Word[]>;
  private _randomWords$: Observable<Word[]>;

  private _lastWords: Word[];

  private randomCount: number = 6;
  private searchCount: number = 50;
  private wordsCount: number = 100;

  private _categoryFilter: string;
  private dicoCollection: string;
  public selectedWord: Word;
  public userDoc: AngularFirestoreDocument;

  public categories = ['other', 'book', 'lyrics', 'travel', 'guitare', 'tech', 'conv', 'net', 'Caving', 'check'];

  constructor(private auth: AuthService) {}

  async initialise(dico: Dico) {
    this.dicoCollection = dico.collection;
    console.log('initialise', this.dicoCollection);

    this.userDoc = await this.auth.getUserDoc();
    if (!this.userDoc) {
      this.dicoCollection = null;
      throw new Error('No user found!');
    }
    console.log('userDoc', this.userDoc.ref.path);

    this._words$ = this._category$.pipe(
      switchMap(category => {
        return this.userDoc
          .collection<Word>(this.dicoCollection, this.wordQuery(category, this))
          .snapshotChanges()
          .pipe(
            map(actions => {
              console.log('_words$', category, actions.length);
              return this.mapToWords(actions);
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
        const search = (_search || '').trim();
        const len = search.length;
        let querySearch = search;
        const nakedSearch = search.replace(/[\^\$]/g, '');

        if (search[0] === '^' && search[len - 1] === '$') {
          querySearch = search;
        } else if (search[0] === '^') {
          querySearch = search.length > 5 ? search.substr(0, 5) : (querySearch = search);
        } else if (search[len - 1] === '$') {
          querySearch = search.length > 5 ? search.substr(len - 5, 5) : (querySearch = search);
        } else if (search.length > 4) {
          querySearch = search.substr(0, 4);
        } else {
          querySearch = search;
        }

        console.log('search', querySearch, nakedSearch);
        return this.userDoc
          .collection<Word>(this.dicoCollection, this.filterEnSearch(querySearch, this))
          .snapshotChanges()
          .pipe(
            map(actions => {
              console.log('_searchedWords$', actions.length);
              const words = this.mapToWords(actions);
              return _(words)
                .filter(w => w.en.includes(nakedSearch))
                .orderBy(w => w.en.split(' ')[0])
                .orderBy(w => _.find(w.en.split(' '), sw => sw === nakedSearch))
                .value();
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
      return new Word({ id, ...data });
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
    category: string,
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

  set categoryFilter(val: string) {
    this._categoryFilter = val;
  }
}
