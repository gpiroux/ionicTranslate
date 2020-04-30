import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';

import { Word, wordTypes } from 'src/app/models/word.model';
import { WordService } from 'src/app/services/word.service';
import { DicoWord } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FileSystemService } from 'src/app/services/file-system.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})

export class DetailPage implements OnInit {
  traductions: DicoWord[];
  newWord: Word;

  audioIdx = 0;
  audioPlaying = false;

  typeOptions: string[] = wordTypes;
  categoryOptions = [
    'other',
    'novel',
    'conv',
    'net',
    'lyrics',
    'check',
    'Caving',
    'Collins',
    'XP',
    'ESL',
  ]

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private httpNative: HTTP,
    private httpClient: HttpClient,
    private fileSystem: FileSystemService,
    private platform: Platform
  ) {
    // html page initialwed before ngOnInit()
    this.newWord = new Word();
  }

  ngOnInit() {

    // fix me 
    const wordId = this.activatedRoute.snapshot.paramMap.get('wordId');
    const searchString = this.activatedRoute.snapshot.paramMap.get('searchString');
    const displayedWords = this.wordService.displayedWords;

    if (wordId) {
      let word = displayedWords.find(w => w.id === wordId);
      this.newWord = _.cloneDeep(word);
    } else {
      this.newWord = new Word()
      this.newWord.en = (searchString || '').toLowerCase()
      this.newWord.fr = '';
    }
    this.wordService.selectedWord = this.newWord;
    console.log(this.newWord)
  }

  async onSave(): Promise<void> {
    if (this.newWord.id) {
      await this.wordService.updateWord(this.newWord);
    } else {
      await this.wordService.createWord(this.newWord);
    }
  }

  async playAudio(audioArray: string[]) {
    if (this.audioPlaying) return;
    this.audioPlaying = true;

    const audio = audioArray[this.audioIdx % audioArray.length];

    try {
      const blobURL = await this.fileSystem.loadMP3(audio) as string;
      console.log('########## PLAY FROM LOCAL FILE ##########');
      const player = new Audio();
      player.src = blobURL;
      player.play();
      this.audioIdx++;
    } catch(err) {
      console.error('LOAD - ', err.message || err);
      await this.fetchAudioAndPlay(audio);
    }
    this.audioPlaying = false;
  }

  async fetchAudioAndPlay(audio: string) {
    const url = `http://voix.larousse.fr/anglais/${audio}.mp3`;
    let data;

    try {
      data = this.platform.is('ios')
        ? await this.httpNative.sendRequest(url, {method: 'get', responseType: 'blob'}).then(res => res.data)
        : await this.httpClient.get(url, {responseType: 'blob'}).toPromise();
    } catch(err) {
      console.error("HTTP - ", err.message || err);
      return
    }

    try {
      await this.fileSystem.writeMP3(audio, data);
    } catch(err) {
      console.error("WRITE - ", err.message || err);
    }

    console.log('########## PLAY FROM REMOTE FILE ##########');
    const player = new Audio();
    player.src = URL.createObjectURL(data);
    player.addEventListener('ended', () => URL.revokeObjectURL(player.src));
    player.play();
    this.audioIdx++;
  }
}
