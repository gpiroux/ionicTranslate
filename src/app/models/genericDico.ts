import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Http as CapacitorHttp } from '@capacitor-community/http';

import _ from 'lodash';
import { DicoWord, OtherTraduction } from './dicoResult.model';
import { firstValueFrom } from 'rxjs';

export interface ParseResult {
  dicoWords: DicoWord[];
  otherTradutions: OtherTraduction[];
}

export abstract class genericDico {
  cache: { [key: string]: string } = {};
  webSite: string;

  constructor(protected httpClient: HttpClient, protected platform: Platform) {}

  protected hasClassValue(el: Element | ChildNode, className: string): boolean {
    return _.get(el, ['attributes', 'class', 'value'], '') === className;
  }

  protected getClassValue(el: Element | ChildNode): string {
    return _.get(el, ['attributes', 'class', 'value'], '').trim();
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

  protected trim(str: string) {
    return str
      .replace(new RegExp(String.fromCharCode(160), 'g'), ' ') // &nbsp
      .replace(/ *, *, */g, ', ') // replace    " , , " => ", "
      .replace(/ *, */g, ', ') // replace    " , " => ", "
      .replace(/ *, *$/, '') // remove end "," => ""
      .replace(/ +/g, ' ');
  }

  protected globalTrim(str: string) {
    return this.trim(this.extraTrim(str));
  }

  abstract parse(data: string): ParseResult;

  async load(href: string, proxy = false): Promise<ParseResult> {
    let url;

    if (proxy && !this.platform.is('hybrid') && !window['isElectron']) {
      const proxyUrl = 'us-central1-ionictranslate5.cloudfunctions.net/forward?url=';
      url = `https://${proxyUrl}${this.webSite}/${href}`;
    } else {
      url = `https://${this.webSite}/${href}`;
    }

    let data: string = this.cache[href];

    if (!data) {
      if (this.platform.is('hybrid')) {
        const response = await CapacitorHttp.get({ url, responseType: 'text' });
        data = response.data as string;
      } else {
        data = await firstValueFrom(this.httpClient.get(url, { responseType: 'text' }));
      }
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
