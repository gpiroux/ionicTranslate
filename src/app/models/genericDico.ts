import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';

import * as _ from 'lodash';
import { DicoWord, OtherTraduction } from './dicoResult.model';

export interface ParseResult {
  dicoWords: DicoWord[];
  otherTradutions: OtherTraduction[];
}

export abstract class genericDico {
  cache: { [key: string]: string } = {};
  webSite: string;

  constructor(protected httpNative: HTTP, protected httpClient: HttpClient, protected platform: Platform) {}

  protected getClassValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'class', 'value'], '');
  }

  protected getRoleValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'role', 'value'], '');
  }

  protected getHrefValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'href', 'value'], '');
  }

  protected getSrcValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'src', 'value'], '');
  }

  protected getLinkValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'link', 'value'], '');
  }

  protected getStyleValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'style', 'value'], '');
  }

  protected getIdValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'id', 'value'], '');
  }

  protected extraTrim(str: string) {
    // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
    return str
      .trim()
      .replace(new RegExp(String.fromCharCode(160), 'g'), ' ') // &nbsp
      .replace(new RegExp(String.fromCharCode(8212), 'g'), '-') // '\—'
      .replace(/[^\ -\~\u00C0-\u017F\→]/g, '') // ASCII: '\ ' code: 32  => '\~' code: 127
      .replace(/\( +/g, '(')
      .replace(/ +\)/g, ')')
      .replace(/ +/g, ' ');
  }

  protected globalTrim(str: string) {
    return this.extraTrim(str)
      .replace(/ *, *, */g, ', ') // replace    " , , " => ", "
      .replace(/ *, */g, ', ') // replace    " , " => ", "
      .replace(/ *, *$/, ''); // remove end "," => ""
  }

  abstract parse(data: string): ParseResult;

  async load(href: string, proxy = false): Promise<ParseResult> {
    let url;

    if (proxy && !this.platform.is('cordova') && !this.platform.is('electron')) {
      const proxyUrl = 'us-central1-ionictranslate5.cloudfunctions.net/forward?url=';
      url = `https://${proxyUrl}${this.webSite}/${href}`;
    } else {
      url = `https://${this.webSite}/${href}`;
    }

    let data: string = this.cache[href];

    if (!data) {
      data = this.platform.is('cordova')
        ? await this.httpNative.get(url, {}, {}).then(res => res.data)
        : await this.httpClient.get(url, { responseType: 'text' }).toPromise();
    }

    // Clear cache
    this.cache[href] = undefined;

    try {
      let parsedData = this.parse(data);

      // For additional traduction, save also the href of the selected one ((Larousse))
      let cacheHref = _.find(parsedData.otherTradutions, tr => tr.selected);
      if (cacheHref) {
        this.cache[cacheHref.href] = data;
      }
      // Update cache
      this.cache[href] = data;
      return parsedData;
    } catch (err) {
      console.log('Err', err);
      throw new Error(`Parsing issue - ${href} - Err: ${err}`);
    }
  }
}
