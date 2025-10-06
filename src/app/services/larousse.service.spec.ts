import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { LarousseService } from './larousse.service';
import * as fs from 'fs';

describe('LarousseService', () => {
  it('should be created', done => {
    let HttpClientSpy: HttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const platformSpy: Platform = jasmine.createSpyObj('Platform', ['is']);
    platformSpy.is.and.returnValue(false);
    const service: LarousseService = new LarousseService(HttpClientSpy, platformSpy);

    expect(service).toBeTruthy();
    done();
  });

  it('should parse data', done => {
    let HttpClientSpy: HttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const platformSpy: Platform = jasmine.createSpyObj('Platform', ['is']);
    platformSpy.is.and.returnValue(false);
    const service: LarousseService = new LarousseService(HttpClientSpy, platformSpy);

    var oReq = new XMLHttpRequest();
    oReq.onload = function (res) {
      let data = this.responseText;
      let result = service.parse(data);
      expect(result.length).toEqual(3);
      return done();
    };

    let file = 'roar';
    oReq.open('get', `https://www.larousse.fr/dictionnaires/anglais-francais/${file}`, true);
    oReq.send();
  });
});
