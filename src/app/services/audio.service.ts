import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';

import { HttpClient } from '@angular/common/http';

import { FileSystemService } from './file-system.service';

import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  constructor(
    private httpNative: HTTP,
    private httpClient: HttpClient,
    private fileSystem: FileSystemService,
    private platform: Platform
  ) {}

  async fetchAudio(audio: string): Promise<Blob> {
    let url: string;
    if (!this.platform.is('cordova') && !window['isElectron']) {
      const proxyUrl = 'us-central1-ionictranslate5.cloudfunctions.net/forward?url=';
      url = `https://${proxyUrl}voix.larousse.fr/anglais/${audio}.mp3`;
    } else {
      url = `https://voix.larousse.fr/anglais/${audio}.mp3`;
    }

    try {
      return this.platform.is('cordova')
        ? await this.httpNative.sendRequest(url, { method: 'get', responseType: 'blob' }).then(res => res.data)
        : await this.httpClient.get(url, { responseType: 'blob' }).toPromise();
    } catch (err) {
      console.error('HTTP - ', err.message || err);
      return;
    }
  }

  async playAudio(data: Blob | string): Promise<void> {
    const player = new Audio();
    if (_.isString(data)) {
      player.src = data;
    } else {
      player.src = URL.createObjectURL(data);
      player.addEventListener('ended', () => URL.revokeObjectURL(player.src));
    }
    await player.play();
  }

  async loadAudio(audio: string): Promise<string> {
    try {
      return await this.fileSystem.loadMP3(audio);
    } catch (err) {
      console.error('LOAD - ', err.message || err);
    }
  }

  async saveAudio(audio: string, data: Blob): Promise<void> {
    try {
      await this.fileSystem.writeMP3(audio, data);
    } catch (err) {
      console.error('WRITE - ', err.message || err);
    }
  }
}
