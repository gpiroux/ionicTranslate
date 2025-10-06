import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { DicoWord, Traduction, OtherTraduction } from '../models/dicoResult.model';
import _ from 'lodash';
import { genericDico, ParseResult } from '../models/genericDico';

@Injectable({
  providedIn: 'root',
})
export class LarousseService extends genericDico {
  result: DicoWord[];

  constructor(protected httpClient: HttpClient, protected platform: Platform) {
    super(httpClient, platform);
    this.webSite = 'www.larousse.fr';
  }

  protected feedTraductionField(element: Element, currentTraduction: Traduction) {
    _.forEach(element.childNodes, ee => {
      if (ee.nodeName == 'A' && this.hasClassValue(ee, 'lienarticle2')) {
        currentTraduction.traduction += this.extraTrim(ee.textContent);
      } else if (ee.nodeName == 'SPAN' && ['Genre'].includes(this.getClassValue(ee))) {
        currentTraduction.traduction += ee.textContent.includes(',') ? ', ' : '';
      } else if (ee.nodeName == 'SMALL' && ['oubien'].includes(this.getClassValue(ee))) {
        currentTraduction.traduction += 'OU';
      } else if (ee.nodeType === 3) {
        currentTraduction.traduction += ee.textContent;
      }
    });
  }

  private parseArticleBilingue(elements: HTMLCollection) {
    let word: DicoWord;
    let currentTraduction: Traduction;

    function parseZoneGram(elements: HTMLCollection) {
      _.forEach(elements, e => {
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'CategorieGrammaticale')) {
          word.categorie += e.textContent.trim();
          console.log('CategorieGrammaticale', word.categorie);
        }
      });
    }

    function parseFormeFlechie2(elements: HTMLCollection) {
      _.forEach(elements, ee => {
        if (ee.nodeName == 'AUDIO' && this.getSrcValue(ee).includes('anglais')) {
          word.audio.push(this.getSrcValue(ee).split('/').pop());
        }
      });
    }

    function parseZoneEntree(elements: HTMLCollection) {
      word = new DicoWord();
      this.result.push(word);

      _.forEach(elements, e => {
        if (e.nodeName == 'AUDIO' && this.getSrcValue(e).includes('anglais')) {
          word.audio.push(this.getSrcValue(e).split('/').pop());
        }

        if (e.nodeName == 'H2' && this.hasClassValue(e, 'Adresse')) {
          word.en = e.textContent.trim();
        }

        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Metalangue')) {
          word.metalangue = e.textContent.trim(); // (US) vs (UK)
        }

        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Phonetique')) {
          word.phonetique += e.textContent.trim();
          word.phonetique = word.phonetique.replace('[ ', '[');
        }

        // Plurial form : "FormeFlechie2"
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'FormeFlechie2')) {
          word.formeFlechie += this.trim(e.textContent);
          parseFormeFlechie2.bind(this)(e.children);
        }

        if (e.nodeName == 'DIV' && this.hasClassValue(e, 'ZoneGram')) {
          parseZoneGram.bind(this)(e.children);
        }
      });
    }

    function parseDivisionExpression(elements: HTMLCollection, index: number) {
      let subExpression = new Traduction();
      subExpression.number = index.toString();
      currentTraduction.subExpressions.push(subExpression);

      _.forEach(elements, e => {
        // Metalangue
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Indicateur')) {
          subExpression.indicateur += e.textContent;
        }

        // Traduction
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Traduction2')) {
          this.feedTraductionField(e, subExpression);
        }
      });
    }

    function parseZoneExpression(elements: HTMLCollection) {
      if (!currentTraduction || !currentTraduction.empty()) {
        currentTraduction = new Traduction();
        word.traductions.push(currentTraduction);
      }

      _.forEach(elements, e => {
        // Locution
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Locution2')) {
          currentTraduction.locution += e.textContent;
        }

        // Traduction
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Traduction2')) {
          this.feedTraductionField(e, currentTraduction);
        }

        // Goose
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Glose2')) {
          this.feedTraductionField(e, currentTraduction);
        }

        // Metalangue
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Metalangue')) {
          currentTraduction.indicateur += e.textContent;
        }

        // Ajout code audio anglais
        if (e.nodeName == 'AUDIO' && this.getSrcValue(e).includes('anglais')) {
          currentTraduction.audio = this.getSrcValue(e).split('/').pop();
        }

        // DivisionExpression
        if (e.nodeName == 'OL' && this.hasClassValue(e, 'DivisionExpression')) {
          _.forEach(
            e.children,
            (li, idx) => li.nodeName == 'LI' && parseDivisionExpression.bind(this)(li.children, idx + 1)
          );
        }
      });
    }

    function parseRenvois(elements: HTMLCollection) {
      if (!currentTraduction || !currentTraduction.empty()) {
        currentTraduction = new Traduction();
        word.traductions.push(currentTraduction);
      }

      _.forEach(elements, ee => {
        if (ee.nodeName == 'A' && this.hasClassValue(ee, 'lienarticle')) {
          currentTraduction.lien = this.getHrefValue(ee);
          currentTraduction.traduction = ee.textContent;
        }
      });
    }

    function parseZoneTexte(elements: HTMLCollection, index?: string) {
      currentTraduction = new Traduction();
      index && (currentTraduction.number = `${index}.`);
      word.traductions.push(currentTraduction);

      _.forEach(elements, e => {
        // Traduction
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Traduction')) {
          this.feedTraductionField(e, currentTraduction);
          console.log('trad', currentTraduction.traduction);
        }

        if (e.nodeName == 'SPAN' && ['Indicateur', 'Metalangue'].includes(this.getClassValue(e))) {
          currentTraduction.indicateur += e.textContent + ' ';
        }

        if (e.nodeName == 'SPAN' && ['IndicateurDomaine'].includes(this.getClassValue(e))) {
          currentTraduction.indicateurDomaine += e.textContent;
        }

        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Renvois')) {
          parseRenvois.bind(this)(e.children);
        }

        // ZoneExpression
        if (e.nodeName == 'DIV' && this.hasClassValue(e, 'ZoneExpression')) {
          parseZoneExpression.bind(this)(e.children);
        }

        // division-semantique
        if (e.nodeName == 'DIV' && this.hasClassValue(e, 'division-semantique')) {
          parseZoneTexte.bind(this)(e.children);
        }

        // Ash
        if (e.nodeName == 'SPAN' && this.hasClassValue(e, 'Glose2')) {
          currentTraduction.traduction += e.textContent;
        }

        if (e.nodeName == 'OL' && this.hasClassValue(e, 'ZoneSemantique')) {
          _.forEach(
            e.children,
            (li, idx) => li.nodeName == 'LI' && parseZoneTexte.bind(this)(li.children, `${index}.${idx + 1}`)
          );
        }
      });
    }

    _.forEach(elements, el => {
      // ZoneEntree
      if (this.hasClassValue(el, 'ZoneEntree')) parseZoneEntree.bind(this)(el.children);

      // ZoneTexte
      if (this.hasClassValue(el, 'ZoneTexte')) {
        if (el.children[0].nodeName == 'OL') {
          _.forEach(
            el.children[0].children,
            (li, idx) => li.nodeName == 'LI' && parseZoneTexte.bind(this)(li.children, idx + 1)
          );
        } else {
          parseZoneTexte.bind(this)(el.children);
        }
      }

      // SousArticle – call recursif
      if (this.hasClassValue(el, 'SousArticle')) this.parseArticleBilingue(el.children);
    });
  }

  private parseSearchElements(elements: HTMLCollection) {
    let result: OtherTraduction[] = [];

    function parseElement(e: Element) {
      if (e.nodeName === 'SECTION') {
        _.forEach(e.children, parseElement.bind(this));
      }

      if (e.nodeName === 'ARTICLE') {
        let trad = new OtherTraduction();
        result.push(trad);

        if (this.getClassValue(e) === 'sel') {
          trad.selected = true;
        }
        let link = e.childNodes[0].childNodes[0];
        trad.word = link.textContent;
        trad.href = this.getHrefValue(link);

        // Remove extra links that refer to anchor (example with 'word')
        if (trad.href.includes('#')) result.pop();
      }
    }

    _.forEach(elements, parseElement.bind(this));

    return result;
  }

  parse(data: string): ParseResult {
    this.result = [];

    const result: ParseResult = { dicoWords: [], otherTradutions: [] };
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data, 'text/html');

    // Main dico parsing
    const article = htmlDoc.getElementsByClassName('article_bilingue');
    if (article && article[0]) {
      this.parseArticleBilingue(article[0].children);
      this.result.map(r => {
        r.en = this.globalTrim(r.en);
        r.traductions.map(rr => {
          rr.traduction = this.globalTrim(rr.traduction);
        });
      });
      result.dicoWords = this.result;
    }

    const nav = htmlDoc.getElementsByClassName('search');
    if (nav && nav[0] && nav[0].children && nav[0].children[0]) {
      result.otherTradutions = this.parseSearchElements(nav[0].children[0].children);
    }

    console.log('Result', result);

    return result;
  }
}
