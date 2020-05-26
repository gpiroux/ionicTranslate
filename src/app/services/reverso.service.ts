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

@Injectable({
  providedIn: 'root',
})
export class ReversoService extends genericDico {
  constructor(protected httpNative: HTTP, protected httpClient: HttpClient, protected platform: Platform) {
    super(httpNative, httpClient, platform);
    this.webSite = 'https://dictionnaire.reverso.net';
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

  private parseElements(elements: Element) {
    let result: DicoWord[] = [];
    let word: DicoWord;
    let traduction: Traduction;

    const roughContent = this.getTextContent(elements);
    if (roughContent.length) console.log(roughContent);

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

    // <div class="snippets">
    const translateBoxes = htmlDoc.getElementsByClassName('translate_box0');
    const translateBox = translateBoxes && translateBoxes[0];

    if (translateBox) {
      result.dicoWords = this.parseElements(translateBox);
    }

    return result;
  }
}
