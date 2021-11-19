import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonTextarea, NavController } from '@ionic/angular';

import { Word, wordTypes } from 'src/app/models/word.model';
import { DicoWord } from 'src/app/models/dicoResult.model';

import { AudioService } from 'src/app/services/audio.service';
import { WordService, dicoList, DicoWebsite } from 'src/app/services/word.service';
import { NotificationsService } from 'src/app/services/notifications.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
  isActualView: boolean;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Esc
    if (event.keyCode === 27 && this.isActualView) {
      this.router.navigate([''], { relativeTo: this.route });
    }
    // Cmd+S
    if (event.getModifierState && event.getModifierState('Meta') && event.keyCode === 83 && this.isActualView) {
      this.onSave()
        .then(() => this.router.navigate([''], { relativeTo: this.route }))
        .catch(err => this.notificationService.error(err.message || err));
    }
    // Cmd+L
    if (
      event.getModifierState &&
      event.getModifierState('Meta') &&
      event.keyCode === 76 &&
      this.isActualView &&
      this.isLarousseDico
    ) {
      this.router.navigate(['larousse'], { relativeTo: this.route });
    }
  }

  traductions: DicoWord[];
  newWord: Word;

  audioIdx = 0;
  fetchAudio = false;

  isLarousseDico: boolean;
  isVandaleDico: boolean;

  typeOptions: string[] = wordTypes;
  categoryOptions = [
    'other',
    'guiare',
    'tech',
    'novel',
    'conv',
    'net',
    'lyrics',
    'check',
    'Caving',
    'Collins',
    'XP',
    'ESL',
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private audioService: AudioService,
    private navCtrl: NavController,
    private notificationService: NotificationsService,
    private router: Router,
    private route: ActivatedRoute
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
      this.newWord = new Word();
      this.newWord.en = (searchString || '')
        .trim()
        .replace(/^\^|\$$/g, '')
        .toLowerCase();
      this.newWord.fr = '';
    }
    this.wordService.selectedWord = this.newWord;
    console.log('Detail world', this.newWord);
  }

  ionViewWillEnter() {
    this.isActualView = true;
  }

  ionViewWillLeave() {
    this.isActualView = false;
  }

  async onSave(): Promise<void> {
    if (this.newWord.id) {
      await this.wordService.updateWord(this.newWord);
    } else {
      await this.wordService.createWord(this.newWord);
    }
  }

  async playAudio(audioArray: string[]) {
    if (this.fetchAudio || !audioArray || !audioArray.length) return;

    const audio = audioArray[this.audioIdx % audioArray.length];

    const blobURL = await this.audioService.loadAudio(audio);
    if (blobURL) {
      this.audioService.playAudio(blobURL);
      this.audioIdx++;
    } else {
      this.fetchAudio = true;
      const data = await this.audioService.fetchAudio(audio);
      if (data) {
        this.audioService.saveAudio(audio, data);
        await this.audioService.playAudio(data);
        this.audioIdx++;
      }
    }
    this.fetchAudio = false;
  }

  async checkTextArea(textAreaView: IonTextarea) {
    const textArea = await textAreaView.getInputElement();
    if (textArea.parentElement.style.height === '0px') {
      setTimeout(() => {
        const height = Math.max(52, textArea.scrollHeight);
        textArea.parentElement.style.height = height + 'px';
        textArea.style.height = height + 'px';
      }, 50);
    }
  }

  valueChanged(textArea: IonTextarea) {
    setTimeout(() => this.checkTextArea(textArea), 50);
  }
}
