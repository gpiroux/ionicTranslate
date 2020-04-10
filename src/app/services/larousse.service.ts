import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http'

import { DicoWord, Traduction, OtherTraduction } from '../models/dicoResult.model';
import * as _ from 'lodash';

import { environment } from 'src/environments/environment'

interface ParseResult { 
  dicoWords : DicoWord[], 
  otherTradutions: OtherTraduction[] 
}

@Injectable({
  providedIn: 'root'
})
export class LarousseService {
  cache: { [key:string]: string } = {};
  
  constructor(
    private httpNative: HTTP,
    private httpClient: HttpClient
  ) { }

  private getClassValue(el: Element | ChildNode) {
    return _.get(el, ['attributes', 'class', 'value'], '')
  }

  private getRoleValue(el: Element | ChildNode) {
    return _.get(el, ['attributes', 'role', 'value'], '')
  }

  private getHrefValue(el: Element | ChildNode) {
    return _.get(el, ['attributes', 'href', 'value'], '')
  }

  private getLinkValue(el: Element | ChildNode) {
    return _.get(el, ['attributes', 'link', 'value'], '')
  }

  private extraTrim(str: string) {
    return str.trim()
      .replace(/[^a-zA-Z\u00C0-\u017F\-\'\,\(\)\[\] ]/g, '')
      .replace(/\( +/g,'(')
      .replace(/ +\)/g,')')
      .replace(/ +/g, ' ');
  }

  private globalTrim(str: string) {
    return this.extraTrim(str)
      .replace(/ *, *, */g, ', ')  // replace    " , , " => ", "
      .replace(/ *, */g, ', ')     // replace    " , " => ", "
      .replace(/ *, *$/, '')       // remove end "," => ""
  }

  private parseElements(elements: HTMLCollection) {
    let result: DicoWord[] = [];
    let word: DicoWord;
    let audio: string;

    let parseElement = (e: Element) => {

        /*
         *  ### Lienson ###
         *  They are all saved (keep only unique list)

         <a class="lienson" href="/dictionnaires-prononciation/anglais/goose/19207A"> </a>
         <h1 class="Adresse" lang="en" xml:lang="en">goose </h1>
         <span class="Phonetique"> [gu:s]</span>

         <span class="FormeFlechie2">
             (
             <a class="lienson" href="/dictionnaires-prononciation/anglais/goose/19207B"> </a>
             <span class="FormeFlechie1">pl</span>
             geese
             <span class="Phonetique"> [gi:s]</span>
             )
         </span>
         <br />
         <span class="CategorieGrammaticale" lang="en" xml:lang="en"> noun</span>

         */

        if (e.nodeName == 'A' && this.getClassValue(e) === 'lienson') {
            audio = this.getHrefValue(e).split('/').pop();
        }

        /* ### Word ###

         <a class="lienson" href="/dictionnaires-prononciation/anglais/goose/19207A"> </a>
         <h1 class="Adresse" lang="en" xml:lang="en">goose </h1>
         <span class="Phonetique"> [gu:s]</span>
         <span class="FormeFlechie2">
             (
             <a class="lienson" href="/dictionnaires-prononciation/anglais/goose/19207B"> </a>
             <span class="FormeFlechie1">pl</span>
             geese
             <span class="Phonetique"> [gi:s]</span>
             )
         </span>
         <br />
         <pan class="CategorieGrammaticale" lang="en" xml:lang="en"> noun</span>


         Example of CategorieGrammaticale:

         <span class="CategorieGrammaticale" lang="en" xml:lang="en"> transitive verb
            <a class="lienconj" href="/conjugaison/anglais/goose/4120">Conjugaison</a>
         </span>

         */

        // Mot anglais
        if (e.nodeName == 'H1' && this.getClassValue(e).indexOf('Adresse') > -1) {
            // Create a new entry if needed
            if (!word || word.en) {
                word = new DicoWord(audio)
                result.push(word);
                audio = '';
            }
            word.en = e.textContent.trim();
        }

        // Phonetique principale
        if (e.nodeName == 'SPAN' && this.getClassValue(e).indexOf('Phonetique') > -1) {
            word.phonetique = e.textContent.trim();
        }

        // Plurial form : "FormeFlechie2"
        if (e.nodeName == 'SPAN' && this.getClassValue(e).indexOf('FormeFlechie2') > -1) {
            _.forEach(e.childNodes, ee => {

                if (ee.nodeName == 'SPAN' && ['Phonetique'].indexOf(this.getClassValue(ee)) > -1) {
                    word.formeFlechie += ee.textContent;
                } else if (ee.nodeType === 3) {
                    word.formeFlechie += ee.textContent;
                }

                if (ee.nodeName == 'A' && this.getClassValue(ee) === 'lienson') {
                  word.audio.push(this.getHrefValue(ee).split('/').pop());
                }
            });
            word.formeFlechie = this.extraTrim(word.formeFlechie);
        }

        // Categorie grammaticale principale (avant traduction)
        if (e.nodeName == 'SPAN' && this.getClassValue(e) === 'CategorieGrammaticale'
                && !word.currentTraduction) {

            _.forEach(e.childNodes, ee => {
                if (ee.nodeType === 3) word.categorie += ee.textContent.trim()
            });
        }

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

        // Ex 'grey' & 'goose'
        var indicateurs = ['Indicateur', 'IndicateurDomaine'];
        if (e.nodeName == 'SPAN' && this.getClassValue(e) == 'Metalangue') {
            if (!word.categorie) {
                word.metalangue = e.textContent.trim();  // (US) vs (UK)
            } else {
                indicateurs.push('Metalangue');
            }
        }

        // Indicateur:
        // <span class="Indicateur"> [car, motorcycle, engine]</span>
        if (e.nodeName == 'SPAN' && indicateurs.indexOf(this.getClassValue(e)) > -1) {
          word.initTraduction();
          word.currentTraduction.indicateur += e.textContent;
        }

        // Locution: 
        // <span class="Locution2" lang="en" xml:lang="en" id="884865">the car roared past</span>
        var locutions = ['Locution2'];
        if (e.nodeName == 'SPAN' && locutions.indexOf(this.getClassValue(e)) > -1) {
          word.initTraduction();
          word.currentTraduction.locution += e.textContent;
        }

        // Traduction
        // <span class="Traduction2" lang="fr" xml:lang="fr"> la voiture est passée en vrombissant</span>
        //
        // <span class="Traduction" lang="fr" xml:lang="fr">  <a class="lienconj2" href="/conjugaison/francais/rugir/8295">Conjugaison</a>
        //    <a class="lienarticle2" href="/dictionnaires/francais-anglais/rugir/69459">rugir</a>
        // </span>
        var traductions = ['Traduction', 'Traduction2', 'Glose2'];
        if (e.nodeName == 'SPAN' && traductions.indexOf(this.getClassValue(e)) > -1) {
          word.initTraduction();

          _.forEach(e.childNodes, ee => {
              if (ee.nodeName == 'A' && ['lienarticle2'].indexOf(this.getClassValue(ee)) > -1) {
                word.currentTraduction.traduction += `${this.extraTrim(ee.textContent)}`.trim()
              } else if (ee.nodeName == 'SPAN' && ['Genre'].indexOf(this.getClassValue(ee)) > -1) { 
                word.currentTraduction.traduction +=  ee.textContent.includes(',') ? ', ' : '';
              } else if (ee.nodeName == 'SMALL' && ['oubien'].indexOf(this.getClassValue(ee)) > -1) {
                word.currentTraduction.traduction += 'OU';
              } else if (ee.nodeType === 3) {
                word.currentTraduction.traduction += ee.textContent;
              }
          });
        }

        /*
         <a class="lienson" href="/dictionnaires-prononciation/anglais/tts/82585ang2">&nbsp;</a>&nbsp;
         <h1 class="Adresse" lang="en" xml:lang="en">gray <span class="etcetera">etc.</span></h1>
         <span class="Metalangue"> (US) </span>
         <br /> →
         <span class="Renvois" lang="en" xml:lang="en">
            <a class="lienarticle" href="/dictionnaires/anglais-francais/grey/584548">grey</a>
         </span>
         */

        if (e.nodeName == 'SPAN' && this.getClassValue(e) === 'Renvois') {
          word.initTraduction();

          _.forEach(e.children, ee => {
              if (ee.nodeName == 'A' && this.getClassValue(ee) == 'lienarticle') {
                word.currentTraduction.lien = this.getHrefValue(ee);
                word.currentTraduction.traduction = ee.textContent;
              }
          });
        }


        // Tables
        if (e.nodeName == 'TABLE') {
            var domElements = e.children[0].children[0].children[1].children;
            _.forEach(domElements, parseElement);
        }


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

        if (e.nodeName == 'SPAN' && this.getClassValue(e) === 'CategorieGrammaticale' 
                && _.get(word, ['currentTraduction', 'locution'])
                && !_.get(word, ['currentTraduction', 'traduction'])) {

            let tradustion2 = new Traduction();
            word.currentTraduction.tradList.push(tradustion2);

            _.forEach(e.children, ee => {

                if (ee.nodeName == 'SPAN' && 'Indicateur' === this.getClassValue(ee)) {
                  tradustion2.indicateur = ee.textContent;
                }

                if (ee.nodeName == 'SPAN' && 'Traduction2' === this.getClassValue(ee)) {
                  tradustion2.traduction = ee.textContent;
                }

            });
        }

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
            _.forEach(e.children, parseElement);
        }
    }

    let parseCorrector = (e: Element) => {
        // if (e.nodeName === 'UL') {
        //     initWord();
        //     _word.categorie = 'Suggestions';

        //     _.forEach(e.children, function(ee) {
        //         var link = ee.getElementsByTagName('a');

        //         initTraduction();
        //         _traduction.lien = link[0].attributes.href.value;
        //         _traduction.traduction = link[0].textContent;

        //         console.log('link', link, link[0].attributes.href.value);
        //     })
        // }

        // if (e.nodeName === 'P' && this.getClassValue(e) === 'err') {
        //     initWord();
        //     _word.categorie = 'Error';
        //     _word.en = e.textContent;
        // }
    }

    _.forEach(elements, parseElement);
    
    // Clean dicoWord
    _.forEach(result, r => {
      _.forEach(r.traductions, tr => {
        tr.traduction = this.globalTrim(tr.traduction)
      })
    })
    return result;
    
    
    // if (type == 'corrector') {
    //     _.forEach(elements, parseCorrector);
    // } 
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

    let parseElement = (e: Element) => {
      // Sub section: "autres résultats"
      if (e.nodeName === 'SECTION') {
        _.forEach(e.children, parseElement);
      }
      
      if (e.nodeName === 'ARTICLE') {
        let trad = new OtherTraduction()
        result.push(trad);
        
        if (this.getClassValue(e) === 'sel') {
          trad.selected = true;
        }
        let link = e.childNodes[0].childNodes[0];
        trad.word = link.textContent;
        trad.href = this.getHrefValue(link);
        // Remove extra links that refer to anchor (example with 'word')
        if (trad.href.includes('#')) result.pop()
      }
    }

    _.forEach(elements, parseElement);
    
    return result;
  }


  parse(data: string) {
    let result: ParseResult = {dicoWords: null, otherTradutions: null};
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(data, "text/html");
    
    // <article role="article">
    let articles = htmlDoc.getElementsByTagName('article');
    let article = _.find(articles, a => this.getRoleValue(a) === 'article');

    if (article) {
      // <div class="article_bilingue">
      let article_bilingue = _.find(article.children, a => this.getClassValue(a) === 'article_bilingue')

      let domElements = article_bilingue.children;
      result.dicoWords = this.parseElements(domElements);
    }

    // <div class="wrapper-search">
    let navs = htmlDoc.getElementsByTagName('div');
    let wrapperSearch = _.find(navs, a => this.getClassValue(a) === 'wrapper-search');

    if (wrapperSearch) {
      let domElements = wrapperSearch.children;
      result.otherTradutions = this.parseSearchElements(domElements);
    }

    return result;

    // // <section class="corrector">
    // let corrector = htmlDoc.getElementsByClassName('corrector');
    // if (corrector) {
    //     let domElements = corrector[0].children;
    //     return this.parseElements(domElements, 'corrector');
    // }

    var error = htmlDoc.getElementsByClassName('err');
    throw error[0].textContent || 'Parsing error';
  }

  async load(href: string): Promise<ParseResult> {
    let url = `http://www.larousse.fr/${href}`;

    let data: string = this.cache[href]
    
    if (!data) {
      data = environment.production
      ? await this.httpNative.get(url, {}, {}).then(res => res.data)
      : await this.httpClient.get(url, {responseType: 'text'}).toPromise()
    }
      
    // Clear cache
    this.cache[href] = undefined;

    try {
      let parsedData = this.parse(data);
      // Update cache
      let cacheHref = _.find(parsedData.otherTradutions, tr => tr.selected)
      if (cacheHref) {
        this.cache[cacheHref.href] = data;
      } 
      this.cache[href] = data;
      return parsedData;
    } catch {
      throw new Error(`Parsing issue - ${href}`);
    }
  }
}
