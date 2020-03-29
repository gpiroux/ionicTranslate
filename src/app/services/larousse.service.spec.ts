import { TestBed } from '@angular/core/testing';
import { LarousseService } from './larousse.service';
import * as fs from 'fs';

describe('LarousseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', (done) => {
    const service: LarousseService = TestBed.get(LarousseService);
    expect(service).toBeTruthy();
    
    var oReq = new XMLHttpRequest();
    oReq.onload = function(res) {      
      let data = this.responseText
      let result = service.parse(data);
      console.log('result', result);
      expect(result.length).toEqual(3)
      return done()
    };

    let file = 'roar';
    oReq.open('get', `https://www.larousse.fr/dictionnaires/anglais-francais/${file}`, true); 
    oReq.send();
  });
});
