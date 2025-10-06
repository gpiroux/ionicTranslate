import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { FileSystemService } from './file-system.service';

import _ from 'lodash';
import { Http as CapacitorHttp } from '@capacitor-community/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  constructor(private httpClient: HttpClient, private fileSystem: FileSystemService, private platform: Platform) {}

  async fetchAudio(audio: string): Promise<Blob | undefined> {
    const proxyUrl = 'us-central1-ionictranslate5.cloudfunctions.net/forward?url=';
    const remotePath = `voix.larousse.fr/anglais/${audio}.mp3`;
    const directUrl = `https://${remotePath}`;
    const url = !this.platform.is('hybrid') && !window['isElectron'] ? `https://${proxyUrl}${remotePath}` : directUrl;

    try {
      if (this.platform.is('hybrid')) {
        const response = await CapacitorHttp.get({ url, responseType: 'arraybuffer' });
        const rawData = response.data;
        const data =
          typeof rawData === 'string' ? this.base64ToUint8Array(rawData) : new Uint8Array(rawData as ArrayBuffer);
        return new Blob([data], { type: 'audio/mpeg' });
      }
      return await firstValueFrom(this.httpClient.get(url, { responseType: 'blob' }));
    } catch (err) {
      console.error('HTTP - ', err instanceof Error ? err.message : err);
      return undefined;
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

  async loadAudio(audio: string): Promise<string | undefined> {
    try {
      return await this.fileSystem.loadMP3(audio);
    } catch (err) {
      console.error('LOAD - ', err instanceof Error ? err.message : err);
      return undefined;
    }
  }

  async saveAudio(audio: string, data: Blob): Promise<void> {
    try {
      await this.fileSystem.writeMP3(audio, data);
    } catch (err) {
      console.error('WRITE - ', err instanceof Error ? err.message : err);
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
