import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonTextarea } from '@ionic/angular';

import { AudioService } from 'src/app/services/audio.service';
import { Word, wordTypes } from 'src/app/models/word.model';
import { WordService, dicoList, DicoWebsite } from 'src/app/services/word.service';
import { DicoWord } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash';


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

  isLarousseDico: boolean;
  isVandaleDico: boolean;

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
    private audioService: AudioService
  ) {
    // html page initialwed before ngOnInit()
    this.newWord = new Word();
  }

  ngOnInit() {    
    const dicoName = this.activatedRoute.snapshot.paramMap.get('dicoName');
    this.isLarousseDico = dicoList[dicoName].dico === DicoWebsite.Larousse;
    this.isVandaleDico = dicoList[dicoName].dico === DicoWebsite.Vandale;
    
    const displayedWords = this.wordService.displayedWords;
    
    const wordId = this.activatedRoute.snapshot.paramMap.get('wordId');
    const searchString = this.activatedRoute.snapshot.paramMap.get('searchString');
    if (wordId) {
      let word = displayedWords.find(w => w.id === wordId);
      this.newWord = _.cloneDeep(word);
    } else {
      this.newWord = new Word()
      this.newWord.en = (searchString || '').trim().replace(/^\^|\$$/g,'').toLowerCase()
      this.newWord.fr = '';
    }
    this.wordService.selectedWord = this.newWord;
    console.log('Detail world', this.newWord);
  }

  async onSave(): Promise<void> {
    if (this.newWord.id) {
      await this.wordService.updateWord(this.newWord);
    } else {
      await this.wordService.createWord(this.newWord);
    }
  }

  async playAudio(audioArray: string[]) {
    if (this.audioPlaying || !audioArray || !audioArray.length) return;
    this.audioPlaying = true;

    const audio = audioArray[this.audioIdx % audioArray.length];
    
    const blobURL = await this.audioService.loadAudio(audio)
    if (blobURL) {
      this.audioService.playAudio(blobURL);
      this.audioIdx++
    } else {
      const data = await this.audioService.fetchAudio(audio);
      if (data) {
        this.audioService.saveAudio(audio , data);
        await this.audioService.playAudio(data);
        this.audioIdx++
      }
    }
    this.audioPlaying = false; 
  }

  async checkTextArea(textAreaView: IonTextarea) {
    const textArea = await textAreaView.getInputElement();
    if (textArea.parentElement.style.height === '0px') {
      setTimeout(() => {
        const height = Math.max(52, textArea.scrollHeight)
        textArea.parentElement.style.height = height + 'px';
        textArea.style.height = height + 'px';
      }, 50);
    }
  }

  valueChanged(textArea: IonTextarea) {
    setTimeout(() => this.checkTextArea(textArea), 50);
  }
}
