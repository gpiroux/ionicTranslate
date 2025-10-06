import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  constructor(private platform: Platform) {}

  async loadMP3(fileName: string): Promise<string> {
    if (!this.platform.is('hybrid')) {
      return Promise.reject(new Error('Native filesystem not available'));
    }

    const path = `${fileName}.mp3`;
    try {
      const { data } = await Filesystem.readFile({
        path,
        directory: Directory.Documents,
      });
      return `data:audio/mpeg;base64,${data}`;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async writeMP3(fileName: string, blob: Blob): Promise<void> {
    if (!this.platform.is('hybrid')) {
      return Promise.reject(new Error('Native filesystem not available'));
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64Data = this.arrayBufferToBase64(arrayBuffer);
    const path = `${fileName}.mp3`;

    await Filesystem.writeFile({
      path,
      directory: Directory.Documents,
      data: base64Data,
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
