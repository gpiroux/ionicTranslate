import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/firestore';

import { WordService } from './word.service';
import { Word } from '../models/word.model';
import * as fs from 'fs';

describe('WordService', () => {
  it('should be created', (done) => {
    let AngularFirestoreSpy: AngularFirestore = jasmine.createSpyObj('AngularFirestore', ['collection']);
    const service: WordService = new WordService(AngularFirestoreSpy);

    expect(service).toBeTruthy();

    done();
  });

  it('should generateSearchString', (done) => {
    let AngularFirestoreSpy: AngularFirestore = jasmine.createSpyObj('AngularFirestore', ['collection']);
    const service: WordService = new WordService(AngularFirestoreSpy);

    const word = new Word();
    word.en = 'liability [ˌlaɪəˈbɪlətɪ] (liabilities)';
    word.generateSearchStrings();
    expect(word.search.length).toBe(13);

    word.en = 'This is a challange [ˌlaɪəˈbɪlətɪ] (liabilities)';
    word.generateSearchStrings();
    expect(word.search.length).toBe(16);
    expect(word.search[2]).toBe('This');

    word.en = 'challenge, testing [ˌlaɪəˈbɪlətɪ] (liabilities)';
    word.generateSearchStrings();
    expect(word.search.length).toBe(22);
    expect(word.search[7]).toBe('chal');

    done();
  });
});
