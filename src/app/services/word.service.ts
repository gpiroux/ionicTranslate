import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { Word } from 'src/app/models/word.model';

import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private _search$: BehaviorSubject<string|null>;
  private _words$: Observable<Word[]>;
  private _searchedWords$: Observable<Word[]>;
  
  constructor(private firestore: AngularFirestore) {
    
    this._search$ = new BehaviorSubject(null);
    
    this._words$ = this.firestore.collection<Word>('words', ref => ref.orderBy('date', 'desc').limit(10))
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
    return this.firestore.collection<Word>('words').add(word);
  }
  
  updateWord(word: Word) {
    Word.updateTimestamp(word);
    return this.firestore.doc<Word>(`words/${word.id}`).update(word);
  }

  deleteWord(id: string) {
    return this.firestore.doc<Word>(`words/${id}`).delete();
  }

}
