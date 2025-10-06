import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import _ from 'lodash';

export const wordTypes = [
  'noun',
  'verb',
  'adverb',
  'adjective',
  'expression',
  'conjunction',
  'interjection',
  'preposition',
  'conjunciton',
  'compound',
];

export enum CategoryMapType {
  short,
  long,
}

export interface WordJson {
  en: string;
  cat: string;
  fr: string;
  type: string;
  date: string;
  key: number;
  audio: string;
  search: string[];
}

export class Word {
  id: string;
  en: string;
  fr: string;
  type: string;
  key: number;
  audio: string[];
  href: string;
  category: string[];
  date: firebase.firestore.Timestamp;
  search: string[];

  constructor(word?) {
    if (!word) {
      this.date = firebase.firestore.Timestamp.fromDate(new Date());
      return;
    }
    this.id = word.id;
    this.en = word.en;
    this.fr = word.fr;
    this.type = word.type;
    this.key = word.key;
    this.audio = word.audio;
    this.href = word.href;
    this.category = word.category;
    this.date = word.date;
    this.search = word.search;
  }

  initJson(word?: WordJson) {
    this.en = word.en || '';
    this.fr = word.fr || '';
    this.type = word.type || '';
    this.key = word.key;
    this.audio = word.audio && word.audio !== 'Not defined' ? word.audio.split(' ') : [];
    this.category = word.cat ? word.cat.split(', ') : [];
    this.date = firebase.firestore.Timestamp.fromDate(new Date(word.date));
    this.search = word.search || [];
  }

  updateTimestamp() {
    this.date = firebase.firestore.Timestamp.fromDate(new Date());
  }

  generateSearchStrings() {
    let search = [];
    let split = _(this.en.split(' '))
      .compact() // remove empty string
      .filter(s => !s.includes('[') && !s.includes(']'))
      .map(s => s.replace(/[,\-\(\)\:]/g, '')) // remove , - ( ) :
      .map(s => s.toLowerCase())
      .filter(s => s.length >= 3)
      .uniq()
      .value();

    _.forEach(split, s => {
      search.push('^' + s + '$');
      _.forEach([3, 4], len => {
        if (s.length >= len)
          for (let i = 0; i < s.length - len + 1; i++) {
            if (i === 0) search.push('^' + s.substr(i, len));
            if (i === s.length - len) search.push(s.substr(i, len) + '$');
            search.push(s.substr(i, len));
          }
      });
    });
    this.search = _.uniq(search);
  }

  clean(): Object {
    const result = {};
    Object.keys(this).forEach(key => {
      if (key !== 'id' && this[key] !== undefined) {
        result[key] = this[key];
      }
    });
    return result;
  }
}
