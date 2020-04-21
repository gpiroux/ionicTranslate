import { CategoryMapType, wordTypes } from './word.model';
import * as _ from 'lodash';

export class DicoWord {
    audio: string[] = [];
    en: string = '';
    phonetique: string = '';
    categorie: string = '';
    metalangue: string = '';
    formeFlechie: string = '';

    traductions: Traduction[] = [];
    currentTraduction: Traduction = null;
    
    constructor() {}

    initTraduction() {
        if (this.currentTraduction 
                && !this.currentTraduction.traduction
                && !this.currentTraduction.tradList.length) {
            return;
        }
        this.currentTraduction = new Traduction()
        this.traductions.push(this.currentTraduction)
    }

    mapWordType(type: CategoryMapType): string {
        const intransitive = 'intransitive';
        const transitive = 'transitive';
        let shortCategory = _.find(wordTypes, c => this.categorie.includes(c));
        
        if (type === CategoryMapType.short) {
            return shortCategory;
        } else if (this.categorie.includes(intransitive)) {
            return `intr. ${shortCategory}`
        } else if (this.categorie.includes(transitive)) {
            return `tr. ${shortCategory}`
        }
        return this.categorie;
    }
}

export class Traduction {
    traduction: string = ''
    locution: string = ''
    indicateur: string = ''
    lien: string = ''
    audio: string = ''
    tradList: Traduction[] = [];
}

export class OtherTraduction {
    href: string = '';
    word: string = '';
    selected: boolean;
}