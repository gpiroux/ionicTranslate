import { Injectable, ANALYZE_FOR_ENTRY_COMPONENTS } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { DicoWord, Traduction } from '../models/dicoResult.model';
import * as _ from 'lodash';
import { genericDico, ParseResult } from '../models/genericDico';

interface Result {
  depth: number;
  text?: string;
  style?: string;
  tag?: string;
}

enum Color {
  red = 'color:#B50000;',
  green = 'color:#008000;',
  bleu = 'color:#0000ff;',
  white = 'color:#ffffff;',
  black = 'color:#0;',
}

@Injectable({
  providedIn: 'root',
})
export class ReversoService extends genericDico {
  constructor(protected httpNative: HTTP, protected httpClient: HttpClient, protected platform: Platform) {
    super(httpNative, httpClient, platform);
    this.webSite = 'dictionnaire.reverso.net';
  }

  private getTextContent(el: Element, depth = 0) {
    let result: Result[] = [];
    _.forEach(el.children, child => {
      const tagName = child.tagName;
      const textContent = this.extraTrim(child.textContent);
      const style = this.getStyleValue(child);
      const id = this.getIdValue(child);
      if (tagName === 'HR') {
        result.push({
          depth: depth,
          tag: 'hr',
        });
      } else if (textContent && id) {
        result.push({
          depth: depth,
          style: style,
          text: textContent,
        });
      } else if (child.children.length) {
        result = result.concat(this.getTextContent(child, depth + 1));
      }
    });
    return result;
  }

  static isNumber(num: string) {
    return !_.isNaN(Number(num));
  }
  static isNotNumber(num: string) {
    return !ReversoService.isNumber(num);
  }

  private parseElements(element: Element) {
    let result: DicoWord[] = [];
    let word: DicoWord;
    let traduction: Traduction;

    const roughContent = this.getTextContent(element);
    if (roughContent.length) console.log(roughContent);

    word = new DicoWord();
    result.push(word);

    _.forEach(roughContent, item => {
      if (item.style === Color.bleu && !word.en) {
        word.en = item.text;
        return;
      }

      // New word, section 1, 2, ...
      if (item.style === Color.white && ReversoService.isNumber(item.text) && word.traductions.length) {
        word = new DicoWord({ en: word.en });
        result.push(word);
        return;
      }

      if (item.tag === 'hr') {
        word = new DicoWord({ en: word.en });
        result.push(word);
        return;
      }

      // Categorie
      if (item.style === Color.red) {
        word.categorie = item.text;
        return;
      }

      if (item.style === Color.white && ReversoService.isNotNumber(item.text)) {
        word.initTraduction();
        word.currentTraduction.number = item.text;
        return;
      }

      // Indicateur
      if (item.style === Color.green) {
        word.initTraduction();
        word.currentTraduction.indicateur = item.text;
        return;
      }

      // Traduction
      if (item.style === Color.black) {
        word.initTraduction();
        word.currentTraduction.traduction = item.text;
        return;
      }

      // Locution
      if (item.style === Color.bleu && word.en && item.text[0] !== '→') {
        word.initTraduction();
        word.currentTraduction.locution = item.text;
        return;
      }
    });

    // Clean dicoWord
    _.forEach(result, r => {
      _.forEach(r.traductions, tr => {
        tr.traduction = this.globalTrim(tr.traduction);
      });
    });
    return result;
  }

  parse(data: string): ParseResult {
    const result: ParseResult = { dicoWords: null, otherTradutions: null };
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data, 'text/html');

    console.log('htmlDoc', htmlDoc);

    // eg: dorp
    const fontElements = htmlDoc.getElementsByTagName('FONT');
    const fontElement = fontElements && fontElements[0];

    // eg: visser
    const mainResultsElement = htmlDoc.getElementById('DivMainResults');

    result.dicoWords = fontElement 
      ? this.parseElements(fontElement) : mainResultsElement 
        ? this.parseElements(mainResultsElement) : []

    return result;
  }
}
