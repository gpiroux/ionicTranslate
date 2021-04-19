import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { DicoWord, Traduction, OtherTraduction } from '../models/dicoResult.model';
import * as _ from 'lodash';
import { genericDico, ParseResult } from '../models/genericDico';

@Injectable({
  providedIn: 'root',
})
export class LarousseService extends genericDico {
  result: DicoWord[];

  phoneticOpen: boolean;
  
  constructor(protected httpNative: HTTP, protected httpClient: HttpClient, protected platform: Platform) {
    super(httpNative, httpClient, platform);
    this.webSite = 'www.larousse.fr';
  }

  protected feedTraductionField(element: Element, currentTraduction: Traduction) {
    _.forEach(element.childNodes, ee => {
      if (ee.nodeName == 'A' && this.hasClassValue(ee, 'lienarticle2')) {
        currentTraduction.traduction += `${this.extraTrim(ee.textContent)}`.trim();
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
      })
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
          word.formeFlechie += this.globalTrim(e.textContent);
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
      try {
        if (!currentTraduction || !currentTraduction.empty()) {
          currentTraduction = new Traduction();
          word.traductions.push(currentTraduction);
        }
      }
      catch(e) {
        console.log(currentTraduction)
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
          _.forEach(e.children, (li, idx) => 
            li.nodeName == 'LI' && parseDivisionExpression.bind(this)(li.children, idx + 1)
          );
        }
      })
    }

    function parseRenvois(elements: HTMLCollection) {
      currentTraduction = new Traduction();
      word.traductions.push(currentTraduction);

      _.forEach(elements, ee => {

        if (ee.nodeName == 'A' && this.hasClassValue(ee, 'lienarticle')) {
          currentTraduction.lien = this.getHrefValue(ee);
          currentTraduction.traduction = ee.textContent;
        }

      });
    }

    function parseZoneTexte(elements: HTMLCollection, index?: number) {
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
      });

    }

    _.forEach(elements, el => {
      // ZoneEntree
      if (this.hasClassValue(el, "ZoneEntree"))  parseZoneEntree.bind(this)(el.children);
      
      // ZoneTexte
      if (this.hasClassValue(el, "ZoneTexte")) {
        if (el.children[0].nodeName == 'OL') {
          _.forEach(el.children[0].children, (li, idx) => 
            li.nodeName == 'LI' && parseZoneTexte.bind(this)(li.children, idx + 1)
          );
        } else {
          parseZoneTexte.bind(this)(el.children)
        }
      };    

      // SousArticle – call recursif
      if (this.hasClassValue(el, "SousArticle")) this.parseArticleBilingue(el.children);
    });
  }

  private parseSearchElements(elements: HTMLCollection) {
    let result: OtherTraduction[] = [];

    /*

        <nav class="search" role="contentinfo">
        <h2>Recherche <b>word</b></h2>
        <p class="count">25 résultats générés en 0ms</p>
        <div class="wrapper-search">
          <article class="sel"><h3><a href="/dictionnaires/anglais-francais/f-word/582617?q=word">f-word</a></h3></article>
          <section>
            <div class="banner-title"><hr class="line-left"/><span class="homebox-title">autres résultats</span><hr class="line-right"/></div>
            <article><h3><a href="/dictionnaires/anglais-francais/word/624795#624796">Word</a></h3></article>
            <article><h3><a href="/dictionnaires/anglais-francais/word/624795">word</a></h3></article>
            <article class="sous-article"><h3><a href="/dictionnaires/anglais-francais/word/624795?q=word#624798">in a word</a></h3></article>
          </section>
          <article><h3><a href="/dictionnaires/anglais-francais/word_association/624800?q=word">word association</a></h3></article>
          <article><h3><a href="/dictionnaires/anglais-francais/word_class/624804?q=word">word class</a></h3></article>
          <article class="itemHidden"><h3><a href="/dictionnaires/anglais-francais/word_count/624805?q=word">word count</a></h3></article>
          <article class="itemHidden"><h3><a href="/dictionnaires/anglais-francais/word_game/624807?q=word">word game</a></h3></article>
        </div>
        </nav>


    */

    function parseElement(e: Element) {
      // Sub section: "autres résultats"
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

  private parseCorrectorElements(elements: HTMLCollection) {
    let result: OtherTraduction[] = [];

    function parseElement(e: Element) {
      if (e.nodeName === 'LI') {
        _.forEach(e.children, parseElement.bind(this));
      }

      if (e.nodeName === 'H3') {
        _.forEach(e.children, parseElement.bind(this));
      }

      if (e.nodeName === 'A') {
        let trad = new OtherTraduction();
        result.push(trad);

        trad.href = this.getHrefValue(e);
        trad.word = e.textContent
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
    const article = htmlDoc.getElementsByClassName('article_bilingue')
    if (article && article[0]) {
      this.parseArticleBilingue(article[0].children);
      result.dicoWords = this.result;
    }

    // Other translation parsing ?

    return result;
  }
}
