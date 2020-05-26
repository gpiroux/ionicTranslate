import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  constructor(private file: File, private platform: Platform) {}

  async loadMP3(fileName: string): Promise<string> {
    if (!this.platform.is('cordova')) {
      return Promise.reject('Cordiva not installed');
    }

    const deferred = new Deferred<string>();
    try {
      const directoryEntry = await this.file.resolveDirectoryUrl(this.file.documentsDirectory);
      const fileEntry = await this.file.getFile(directoryEntry, `${fileName}.mp3`, {});
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onloadend = () => deferred.resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

  async writeMP3(fileName: string, blob: Blob): Promise<void> {
    if (!this.platform.is('cordova')) {
      return Promise.reject('Cordiva not installed');
    }

    const deferred = new Deferred<void>();
    try {
      const directoryEntry = await this.file.resolveDirectoryUrl(this.file.documentsDirectory);
      const fileEntry = await this.file.getFile(directoryEntry, `${fileName}.mp3`, { create: true });
      fileEntry.createWriter((fileWriter) => {
        fileWriter.onwriteend = () => deferred.resolve();
        fileWriter.write(blob);
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }
}

export class Deferred<T> {
  promise: Promise<T>;
  resolve: (arg: T) => void;
  reject: (err: Error) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
