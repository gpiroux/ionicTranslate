import { firstValueFrom, of } from 'rxjs';
import { AngularFirestoreDocument } from '@angular/fire/compat/firestore';

import { WordService, buildSearchQuery, filterSearchResults, dicoList } from './word.service';
import { AuthService } from './auth.service';
import { Word } from '../models/word.model';

function makeWord(en: string, id = en): Word {
  return new Word({ id, en, fr: '' });
}

// Minimal stand-in for an AngularFirestore snapshot action
function toAction(word: Word) {
  const { id, ...data } = word;
  return { payload: { doc: { id, data: () => data } } };
}

describe('WordService', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getUserDoc']);
  });

  it('should be created', () => {
    const service = new WordService(authSpy);
    expect(service).toBeTruthy();
  });

  it('should throw when no user is logged in', async () => {
    authSpy.getUserDoc.and.resolveTo(null as unknown as AngularFirestoreDocument);
    const service = new WordService(authSpy);

    await expectAsync(service.initialise(dicoList.dicoEn)).toBeRejectedWithError('No user found!');
  });

  describe('searchedWords$', () => {
    let whereSpy: jasmine.Spy;
    let service: WordService;

    beforeEach(async () => {
      const stored = ['spy', 'spyware', 'to spy on', 'espionage', 'spyglass'].map(en => makeWord(en));
      const query = { where: () => query, limit: () => query };
      whereSpy = spyOn(query, 'where').and.callThrough();

      const userDoc = {
        ref: { path: 'users/test' },
        collection: (_name: string, queryFn?: (ref: unknown) => unknown) => {
          queryFn?.(query);
          return { snapshotChanges: () => of(stored.map(toAction)) };
        },
      };
      authSpy.getUserDoc.and.resolveTo(userDoc as unknown as AngularFirestoreDocument);

      service = new WordService(authSpy);
      await service.initialise(dicoList.dicoEn);
    });

    it('should query Firestore with the capped search string', async () => {
      service.search$.next('spyware');
      await firstValueFrom(service.searchedWords$);

      expect(whereSpy).toHaveBeenCalledWith('search', 'array-contains', 'spyw');
    });

    it('should return matching words, whole-word matches first', async () => {
      service.search$.next('spy');
      const words = await firstValueFrom(service.searchedWords$);

      expect(words.map(w => w.en)).toEqual(['spy', 'to spy on', 'spyglass', 'spyware']);
    });

    it('should keep the Firestore document id', async () => {
      service.search$.next('spy');
      const words = await firstValueFrom(service.searchedWords$);

      expect(words[0].id).toBe('spy');
    });
  });
});

describe('buildSearchQuery', () => {
  const cases: [string | null, string, string][] = [
    // input, querySearch, nakedSearch
    [null, '', ''],
    ['', '', ''],
    ['  spy  ', 'spy', 'spy'],
    ['spyw', 'spyw', 'spyw'],
    ['spyware', 'spyw', 'spyware'],
    ['^spy', '^spy', 'spy'],
    ['^spyw', '^spyw', 'spyw'],
    ['^spyware', '^spyw', 'spyware'],
    ['are$', 'are$', 'are'],
    ['ware$', 'ware$', 'ware'],
    ['spyware$', 'ware$', 'spyware'],
    ['^spy$', '^spy$', 'spy'],
    ['^spyware$', '^spyware$', 'spyware'],
  ];

  cases.forEach(([input, querySearch, nakedSearch]) => {
    it(`should build ${JSON.stringify(input)} -> ${JSON.stringify(querySearch)}`, () => {
      expect(buildSearchQuery(input)).toEqual({ querySearch, nakedSearch });
    });
  });

  it('should produce a query stored in the search strings of a matching word', () => {
    const word = makeWord('spyware [ˈspaɪwɛə(r)]');
    word.generateSearchStrings();

    ['spy', 'spyw', 'pywa', 'spyware', '^spy', '^spyw', '^spyware', 'are$', 'ware$', 'spyware$', '^spyware$'].forEach(
      search => {
        expect(word.search).withContext(search).toContain(buildSearchQuery(search).querySearch);
      }
    );
  });
});

describe('filterSearchResults', () => {
  it('should keep only the words containing the search', () => {
    const words = ['spy', 'drawback', 'spyware'].map(en => makeWord(en));
    expect(filterSearchResults(words, 'spy').map(w => w.en)).toEqual(['spy', 'spyware']);
  });

  it('should sort by first word', () => {
    const words = ['stake', 'mistake', 'stakeholder'].map(en => makeWord(en));
    expect(filterSearchResults(words, 'take').map(w => w.en)).toEqual(['mistake', 'stake', 'stakeholder']);
  });

  it('should put whole-word matches first', () => {
    const words = ['spyware', 'spyglass', 'to spy on', 'spy'].map(en => makeWord(en));
    expect(filterSearchResults(words, 'spy').map(w => w.en)).toEqual(['spy', 'to spy on', 'spyglass', 'spyware']);
  });

  it('should return everything for an empty search', () => {
    const words = ['b', 'a'].map(en => makeWord(en));
    expect(filterSearchResults(words, '').map(w => w.en)).toEqual(['a', 'b']);
  });
});

describe('Word.generateSearchStrings', () => {
  it('should generate whole-word, prefix, suffix and 3/4-letter search strings', () => {
    const word = makeWord('spy, spying');
    word.generateSearchStrings();

    // prettier-ignore
    expect(word.search).toEqual([
      '^spy$', '^spy', 'spy$', 'spy',
      '^spying$', 'pyi', 'yin', 'ing$', 'ing', '^spyi', 'spyi', 'pyin', 'ying$', 'ying',
    ]);
  });

  it('should ignore phonetics, punctuation, case and words shorter than 3 letters', () => {
    const word = makeWord('To SPY, (US) [spaɪ]');
    word.generateSearchStrings();

    expect(word.search).toEqual(['^spy$', '^spy', 'spy$', 'spy']);
  });
});
