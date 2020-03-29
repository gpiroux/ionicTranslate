import { firestore } from 'firebase';
import * as _ from 'lodash';

export interface WordJson {
    en: string
    cat: string 
    fr: string
    type: string
    date: string
    key: number
    audio: string
    search: string[]
}

export class Word {

    constructor(word?: WordJson) {
        if (!word) return
        this.audio = word.audio && word.audio !== 'Not defined' ? word.audio.split(' ') : [];
        this.category = word.cat ? word.cat.split(', ') : [];
        this.en = word.en || '';
        this.fr = word.fr  || '';
        this.type = word.type || '';
        this.key = word.key;
        this.search = word.search || [];
        this.date = firestore.Timestamp.fromDate(new Date(word.date));
    }

    id: string;
    category: string[];
    audio: string[];
    type: string;
    en: string;
    fr: string;
    date: firestore.Timestamp;
    key: number;
    search: string[];

    static updateTimestamp(word: Word) {
        word.date = firestore.Timestamp.fromDate(new Date());
    }
}
