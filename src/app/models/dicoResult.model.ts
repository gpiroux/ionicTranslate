import { CategoryMapType, wordTypes } from './word.model';
import _ from 'lodash';

export class DicoWord {
  audio: string[] = [];
  en: string = '';
  phonetique: string = '';
  categorie: string = '';
  metalangue: string = '';
  formeFlechie: string = '';

  traductions: Traduction[] = [];
  currentTraduction: Traduction = null;

  constructor(private obj?: any) {
    _.assign(this, obj);
  }

  /**
      Does nothing while currentTraduction exists and no traduction nor traductionSubList
    */
  initTraduction(force = false) {
    if (
      force ||
      !this.currentTraduction ||
      this.currentTraduction.traduction ||
      this.currentTraduction.subExpressions.length
    ) {
      this.currentTraduction = new Traduction();
      this.traductions.push(this.currentTraduction);
    }
  }

  mapWordType(type: CategoryMapType): string {
    const intransitive = 'intransitive';
    const transitive = 'transitive';

    // Try to find exact match
    let shortCategory = _.find(wordTypes, c => this.categorie === c);

    // Not not found try to find a category that include short cat list item
    if (!shortCategory) shortCategory = _.find(wordTypes, c => this.categorie.includes(c));

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
  subExpressions: Traduction[] = [];

  public empty() {
    return !this.locution && !this.traduction && !this.lien && !this.indicateur && !this.indicateurDomaine;
  }
}

export class OtherTraduction {
  href: string = '';
  word: string = '';
  selected: boolean;
  current: boolean;
}
