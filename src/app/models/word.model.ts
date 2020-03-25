import { firestore } from 'firebase';

export interface WordJson {
    en: string
    cat: string 
    fr: string
    type: string
    date: string
    key: number
    audio: string
}

export class Word {

    constructor(word: WordJson) {
        this.audio = word.audio && word.audio !== 'Not defined' ? word.audio.split(' ') : [];
        this.category = word.cat ? word.cat.split(', ') : [];
        this.en = word.en || '';
        this.fr = word.fr  || '';
        this.type = word.type || '';
        this.key = word.key;
        this.date = firestore.Timestamp.fromDate(new Date(word.date));
    }

    id: string;
    category: string[];
    audio: string[];
    type: string;
    en: string;
    fr: string;
    date: firestore.Timestamp
    key: number
}
