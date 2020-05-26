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

  /**
      Does nothing while currentTraduction exists and no traduction nor traductionSubList
    */
  initTraduction(force = false) {
    if (
      force ||
      !this.currentTraduction ||
      this.currentTraduction.traduction ||
      this.currentTraduction.traductionSubList.length
    ) {
      this.currentTraduction = new Traduction();
      this.traductions.push(this.currentTraduction);
    }
  }

  mapWordType(type: CategoryMapType): string {
    const intransitive = 'intransitive';
    const transitive = 'transitive';
    let shortCategory = _.find(wordTypes, c => this.categorie.includes(c));

    if (type === CategoryMapType.short) {
      return shortCategory;
    } else if (this.categorie.includes(intransitive)) {
      return `intr. ${shortCategory}`;
    } else if (this.categorie.includes(transitive)) {
      return `tr. ${shortCategory}`;
    }
    return this.categorie;
  }
}

export class Traduction {
  number: string;
  indicateur: string = '';
  indicateurDomaine: string = '';
  locution: string = '';
  traduction: string = '';
  lien: string = '';
  audio: string = '';
  traductionSubList: Traduction[] = [];
}

export class OtherTraduction {
  href: string = '';
  word: string = '';
  selected: boolean;
}
