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

  private feedTraductionField(e: Element, currentTraduction: Traduction) {
    _.forEach(e.childNodes, ee => {
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

  private parseElements(elements: HTMLCollection) {
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
          word.formeFlechie += e.textContent;
          parseFormeFlechie2.bind(this)(e.children);
        }

        if (e.nodeName == 'DIV' && this.hasClassValue(e, 'ZoneGram')) {
          parseZoneGram.bind(this)(e.children);
        }

      });
    }

    function parseDivisionExpression(elements: HTMLCollection, idx: number) {
      let subExpression = new Traduction();
      subExpression.number = idx.toString();
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

    function parseElement(e: Element) {
      let phoneticOpen: Boolean;
      let audio: any;


      /*

         <span class="Indicateur"> [used lubricant]</span>
         <a class="lienson2" href="/dictionnaires-prononciation/francais/tts/22595fra2">&nbsp;</a>
         <span class="Traduction" lang="fr" xml:lang="fr">
             <a class="lienarticle2" href="/dictionnaires/francais-anglais/cambouis/12322">cambouis</a>
             <span class="Genre"> m</span>
         </span>


         <span class="IndicateurDomaine"> cars</span>
         <a class="lienson2" href="/dictionnaires-prononciation/francais/tts/151561fra2">&nbsp;</a>
         <span class="Traduction" lang="fr" xml:lang="fr">
             <a class="lienconj2" href="/conjugaison/francais/graisser/5130">Conjugaison</a>
             <a class="lienarticle2" href="/dictionnaires/francais-anglais/graisser/37734">graisser</a>,
             <a class="lienconj2" href="/conjugaison/francais/lubrifier/5890">Conjugaison</a>
             <a class="lienarticle2" href="/dictionnaires/francais-anglais/lubrifier/47892">lubrifier</a>
         </span>

         */

      // // Ex 'grey' & 'goose'
      // if (e.nodeName == 'SPAN' && this.getClassValue(e) == 'Metalangue') {
      //   if (!word.categorie) {
      //     if (phoneticOpen) {
      //       word.phonetique += e.textContent; // patent [(UK) ˈpeɪtənt, (US) ˈpætənt]
      //     } else {
      //       word.metalangue = e.textContent.trim(); // (US) vs (UK)
      //     }
      //   } else {
      //     word.initTraduction();
      //     word.currentTraduction.indicateur += e.textContent;
      //   }
      // }

      // Indicateur:
      // <span class="Indicateur"> [car, motorcycle, engine]</span>
      // if (e.nodeName == 'SPAN' && ['Indicateur'].includes(this.getClassValue(e))) {
      //   word.initTraduction();
      //   word.currentTraduction.indicateur += e.textContent;
      // }
      // if (e.nodeName == 'SPAN' && ['IndicateurDomaine'].includes(this.getClassValue(e))) {
      //   word.initTraduction();
      //   word.currentTraduction.indicateurDomaine += e.textContent;
      // }

      // Locution:
      // <span class="Locution2" lang="en" xml:lang="en" id="884865">the car roared past</span>
      // if (e.nodeName == 'SPAN' && ['Locution2'].includes(this.getClassValue(e))) {
      //   word.initTraduction(true);
      //   word.currentTraduction.locution += e.textContent;
      //   if (audio && audio.type === 'lienson3' && audio.value) {
      //     word.currentTraduction.audio = audio.value;
      //     audio = null;
      //   }
      // }


      /*
         <a class="lienson" href="/dictionnaires-prononciation/anglais/tts/82585ang2">&nbsp;</a>&nbsp;
         <h1 class="Adresse" lang="en" xml:lang="en">gray <span class="etcetera">etc.</span></h1>
         <span class="Metalangue"> (US) </span>
         <br /> →
         <span class="Renvois" lang="en" xml:lang="en">
            <a class="lienarticle" href="/dictionnaires/anglais-francais/grey/584548">grey</a>
         </span>
         */

      // if (e.nodeName == 'SPAN' && this.getClassValue(e) === 'Renvois') {
      //   word.initTraduction();

      //   _.forEach(e.children, ee => {
      //     if (ee.nodeName == 'A' && this.getClassValue(ee) == 'lienarticle') {
      //       word.currentTraduction.lien = this.getHrefValue(ee);
      //       word.currentTraduction.traduction = ee.textContent;
      //     }
      //   });
      // }

      // // Tables
      // if (e.nodeName == 'TABLE') {
      //   // Number
      //   const numElement = _.get(e, 'children.0.children.0.children.0.children.0');
      //   if (_.get(numElement, 'nodeName') == 'SPAN' && this.getClassValue(numElement) === 'CategorieGrammaticale') {
      //     word.initTraduction();
      //     word.currentTraduction.number = numElement.textContent;
      //   }

      //   // Other table elements
      //   const domElements = _.get(e, 'children.0.children.0.children.1.children');
      //   _.forEach(domElements, parseElement.bind(this));
      // }

      /*
         <a class="lienson3" href="/dictionnaires-prononciation/anglais/tts/108646ang2">&nbsp;</a>
         <span class="Locution2" lang="en" xml:lang="en" id="884865">the car roared past</span>
         <br />
         <span class="CategorieGrammaticale" lang="en" xml:lang="en">a.
             <span class="Indicateur"> [noisily]</span>
             <a class="lienson2" href="/dictionnaires-prononciation/francais/tts/183728fra2">&nbsp;</a>
             <span class="Traduction2" lang="fr" xml:lang="fr"> la voiture est passée en vrombissant</span>
         </span>
         <span class="CategorieGrammaticale" lang="en" xml:lang="en">b.
             <span class="Indicateur"> [fast]</span>
             <a class="lienson2" href="/dictionnaires-prononciation/francais/tts/183729fra2">&nbsp;</a>
             <span class="Traduction2" lang="fr" xml:lang="fr"> la voiture est passée à toute allure</span>
         </span>
         */

      // if (
      //   e.nodeName == 'SPAN' &&
      //   this.getClassValue(e) === 'CategorieGrammaticale' &&
      //   _.get(word, ['currentTraduction', 'locution']) &&
      //   !_.get(word, ['currentTraduction', 'traduction'])
      // ) {
      //   let tradustion2 = new Traduction();
      //   word.currentTraduction.subExpressions.push(tradustion2);

      //   _.forEach(e.children, ee => {
      //     if (ee.nodeName == 'SPAN' && ['Indicateur', 'Metalangue'].includes(this.getClassValue(ee))) {
      //       tradustion2.indicateur = ee.textContent;
      //     }

      //     if (ee.nodeName == 'SPAN' && 'Traduction2' === this.getClassValue(ee)) {
      //       tradustion2.traduction = ee.textContent;
      //     }
      //   });
      // }

      /*
         <span link="C603420">
             <a class="lienson" href="/dictionnaires-prononciation/anglais/tts/103047ang2">&nbsp;</a>&nbsp;
             <h1 class="Adresse" lang="en" xml:lang="en">pound out</h1>
             <br />
             <span class="CategorieGrammaticale" lang="en" xml:lang="en"> transitive verb separable <a class="lienconj" href="/conjugaison/anglais/pound_out/12384">Conjugaison</a></span>
             <br />
             ...
         </span>

         */
      if (e.nodeName == 'SPAN' && this.getLinkValue(e)) {
        _.forEach(e.children, parseElement.bind(this));
      }
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
      if (this.hasClassValue(el, "SousArticle")) this.parseElements(el.children);
    });

    console.log('Result', this.result);
    return this.result;
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

    const article = htmlDoc.getElementsByClassName('article_bilingue')
    if (article && article[0]) {
      result.dicoWords = this.parseElements(article[0].children);
    }

    // // <div class="wrapper-search">
    // const divs = htmlDoc.getElementsByTagName('div');
    // const wrapperSearch = _.find(divs, a => this.getClassValue(a) === 'wrapper-search');
    // if (wrapperSearch) {
    //   const domElements = wrapperSearch.children;
    //   result.otherTradutions = this.parseSearchElements(domElements);
    // }

    // // <div class="corrector">
    // const sections = htmlDoc.getElementsByTagName('section');
    // const corrector = _.find(sections, a => this.getClassValue(a) === 'corrector');
    // const domElements = corrector ? corrector.getElementsByTagName('li') : null; 
    // if (domElements) {
    //   result.otherTradutions = this.parseCorrectorElements(domElements);
    // }

    // // TBC
    // var error = htmlDoc.getElementsByClassName('err');
    // if (error && error[0]) {
    //   throw error[0].textContent || 'Parsing error';
    // }

    return result;
  }
}
