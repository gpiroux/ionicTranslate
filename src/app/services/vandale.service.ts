import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http'
import { Platform } from '@ionic/angular';

import { DicoWord, Traduction, OtherTraduction } from '../models/dicoResult.model';
import * as _ from 'lodash';
import { genericDico, ParseResult } from '../models/genericDico';

@Injectable({
  providedIn: 'root'
})
export class VanDaleService extends genericDico {

  constructor(
    protected httpNative: HTTP,
    protected httpClient: HttpClient,
    protected platform: Platform
  ) { 
    super(httpNative, httpClient, platform);
    this.webSite = 'https://www.vandale.be';

    // Example: naar
  }

  private parseElements(elements: HTMLCollection) {
    let result: DicoWord[] = [];
    let word: DicoWord;
    let traduction: Traduction;
    let mainTraduction: boolean;
    let indicator: boolean;

    function parseElement(e: Element) {
      if (this.getClassValue(e) !== 'f0f') {
        console.log('ERROR element has no class f0f', e);
        return
      }
      if (this.getClassValue(e.children[0]) !== 'f0j') {
        console.log('ERROR subelement has no class f0j', e);
        return
      }

      const elementsF0j = e.children[0];
      
      // Init result container
      word = new DicoWord()
      result.push(word);
      
      _.forEach(elementsF0j.children, parseChildrenOfElementF0j.bind(this))
    }

    function parseChildrenOfElementF0j(el: Element) {
      if (this.getClassValue(el) === 'f0i') word.en = el.textContent;
      if (this.getClassValue(el) === 'fq') word.categorie += el.textContent.replace(/[()]/g, '');

      if (this.getClassValue(el).includes('f0g')) {
        const elementFz = el.getElementsByClassName('fz')[0];
        const elementF0 = el.getElementsByClassName('f0')[0];
        traduction = new Traduction();
        word.traductions.push(traduction);
        traduction.number = elementFz.children[0].textContent;
        _.forEach(elementF0.children, parseChildrenOfElementF0.bind(this))
      }
    } 

    function parseChildrenOfElementF0(el: Element, idx: number) {
      if (idx === 0 && this.getClassValue(el) === 'fq') {
        mainTraduction = el.textContent.includes('(');
      }
      if (idx === 0 && this.getClassValue(el) === 'fr') {
        mainTraduction = true;
      }
      if (this.getClassValue(el) === 'fr' && 
          (el.textContent === ': ' || el.textContent === '; ')
      ) {
        mainTraduction = false;
        traduction = new Traduction();
        word.traductions.push(traduction);
        return
      }


      // Main traduction including indicateur
      if (mainTraduction) {
        //Check start of indicator
        if (this.getClassValue(el) === 'fq' && el.textContent.includes('(')) {
          indicator = true;
          if (traduction.traduction && traduction.traduction.match(/,\ *$/)) {
            traduction = new Traduction();
            word.traductions.push(traduction);
          }
        }
        if (indicator) {
          traduction.indicateur += el.textContent;
          // Check end of indicator
          if (this.getClassValue(el) === 'fq' && el.textContent.includes(')')) {
            indicator = false;
          }
        } else 
        // If not indicator, check translation
        if (this.getClassValue(el) === 'fr') {
          traduction.traduction += el.textContent;
        } 
      } else 
      // Locution
      if (this.getClassValue(el) === 'fq') {
        traduction.locution += el.textContent;
      } else
      // Tradution
      if (this.getClassValue(el) === 'fr') {
        traduction.traduction += el.textContent;
      }

    }

    _.forEach(elements, parseElement.bind(this));

    // Clean dicoWord
    _.forEach(result, r => {
      _.forEach(r.traductions, tr => {
        tr.traduction = this.globalTrim(tr.traduction)
      })
    })
    return result;
  }

  parse(data: string): ParseResult {
    const result: ParseResult = { dicoWords: null, otherTradutions: null };
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data, "text/html");
    
    console.log('htmlDoc', htmlDoc)

    // <div class="snippets">
    const snippets = htmlDoc.getElementsByClassName('snippets');
    const snippet = snippets && snippets[0]

    if (snippet) {
      const domElements = snippet.children;
      result.dicoWords = this.parseElements(domElements);
    }

    return result;
  }

}