import { TestBed } from '@angular/core/testing';
import { LarousseService } from './larousse.service';
import * as fs from 'fs';

describe('LarousseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', (done) => {
    const service: LarousseService = TestBed.get(LarousseService);
    
    let file = 'pound.html';

    var oReq = new XMLHttpRequest();
    oReq.onload = function(res) {
      //console.log('=============> ', this.responseText)
      
      
      let data = this.responseText
      service.parse(data);
      done()
    };

    oReq.open('get', `https://www.larousse.fr/dictionnaires/anglais-francais/roar/608120`, true);
    oReq.send();
  
    expect(service).toBeTruthy();
  });
});
