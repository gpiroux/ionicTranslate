import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { LarousseService } from './larousse.service';

describe('LarousseService', () => {
  let service: LarousseService;

  beforeEach(() => {
    const httpClientSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    const platformSpy = jasmine.createSpyObj<Platform>('Platform', ['is']);
    platformSpy.is.and.returnValue(false);
    service = new LarousseService(httpClientSpy, platformSpy);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Saved Larousse pages from larousse_example/, served as test assets (angular.json),
  // with the number of entries (`ZoneEntree` blocks) each page contains
  const pages: [string, number][] = [
    ['bite', 5],
    ['entail', 1],
    ['hone', 3],
    ['honey', 2],
    ['mundane', 1],
    ['patent', 3],
    ['strike', 15],
    ['error', 0],
  ];

  pages.forEach(([page, count]) => {
    it(`should parse ${count} word(s) from the "${page}" page`, async () => {
      const response = await fetch(`fixtures/larousse/${page}.html`);
      expect(response.ok).withContext('fixture loaded').toBeTrue();

      const result = service.parse(await response.text());

      expect(result.dicoWords.length).toEqual(count);
      result.dicoWords.forEach(word => expect(word.en).withContext('word.en').not.toBe(''));
    });
  });

  it('should parse the other translations list, even with whitespace between tags', async () => {
    // error.html is a formatted <nav class="search"> fragment
    const response = await fetch('fixtures/larousse/error.html');
    const result = service.parse(await response.text());

    // 11 links, minus the 2 anchors (#) to sub-entries
    expect(result.otherTradutions.length).toEqual(9);
    expect(result.otherTradutions[0].selected).toBeTrue();
    expect(result.otherTradutions[0].word.trim()).toMatch(/^MAP/);
    expect(result.otherTradutions[1].href).toBe('/dictionnaires/anglais-francais/map/593996');
    expect(result.otherTradutions.some(t => t.href.includes('#'))).toBeFalse();
  });
});
