import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';

import { LarousseService } from './larousse.service';
import * as fs from 'fs';

describe('LarousseService', () => {

  it('should be created', (done) => {
    let HttpNativeSpy: HTTP = jasmine.createSpyObj('HTTP', ['get']);
    let HttpClientSpy: HttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const service: LarousseService = new LarousseService(HttpNativeSpy, HttpClientSpy)

    expect(service).toBeTruthy();
    done()
  });

  it('should parse data', (done) => {
    let HttpNativeSpy: HTTP = jasmine.createSpyObj('HTTP', ['get']);
    let HttpClientSpy: HttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const service: LarousseService = new LarousseService(HttpNativeSpy, HttpClientSpy)
    
    var oReq = new XMLHttpRequest();
    oReq.onload = function(res) {      
      let data = this.responseText
      let result = service.parse(data);
      expect(result.length).toEqual(3)
      return done()
    };

    let file = 'roar';
    oReq.open('get', `https://www.larousse.fr/dictionnaires/anglais-francais/${file}`, true); 
    oReq.send();
  });
});
