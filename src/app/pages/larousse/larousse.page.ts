import { Component, OnInit, HostListener } from '@angular/core';
import { PopoverController, NavController } from '@ionic/angular';

import { OtherTraductionPopoverComponent } from './other-traduction-popover/other-traduction-popover.component';

import { WordService } from 'src/app/services/word.service';
import { AudioService } from 'src/app/services/audio.service';
import { LarousseService } from 'src/app/services/larousse.service';
import { NotificationsService } from 'src/app/services/notifications.service';

import { Word, CategoryMapType as WordTypeMapType } from 'src/app/models/word.model';
import { DicoWord, OtherTraduction, Traduction } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-larousse',
  templateUrl: './larousse.page.html',
  styleUrls: ['./larousse.page.scss'],
})
export class LaroussePage implements OnInit {
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Esc
    if (event.keyCode === 27 && this.isActualView) {
      this.navCtrl.back();
    }
  }

  isActualView: boolean;
  selectedWord: Word;
  onInitStrippedWord: string;
  onInitWordHref: string;
  wordTraductions: DicoWord[];
  otherTraductions: OtherTraduction[];

  private popover: HTMLIonPopoverElement;
  public fetchAudio: string;
  public loadedWord: string;

  constructor(
    private larousseService: LarousseService,
    private wordService: WordService,
    private popoverController: PopoverController,
    private notification: NotificationsService,
    private audioService: AudioService,
    private router: Router,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWordEn = _.get(this.selectedWord, 'en');
    const selectedWordHref = _.get(this.selectedWord, 'href');

    this.onInitStrippedWord = selectedWordEn.trim().split(' ')[0].split('[')[0];
    this.onInitWordHref = `dictionnaires/anglais-francais/${this.onInitStrippedWord}`;

    if (selectedWordHref) {
      this.load(selectedWordHref, selectedWordEn);
    } else if (selectedWordEn) {
      this.load(this.onInitWordHref, this.onInitStrippedWord);
    } else {
      this.router.navigateByUrl('');
      this.notification.error('Pas de mot sélectionné !');
    }
  }

  ionViewWillEnter() {
    this.isActualView = true;
  }

  ionViewWillLeave() {
    this.isActualView = false;
  }

  async load(href: string, loadedWord: string) {
    this.loadedWord = loadedWord;
    this.larousseService
      .load(href)
      .then(result => {
        this.wordTraductions = result.dicoWords;

        // this.currentHref
        this.otherTraductions = [
          {
            href: this.onInitWordHref,
            word: this.onInitStrippedWord,
            selected: this.onInitWordHref === href,
            current: true
          },
          ...result.otherTradutions
        ];

        console.log('otherTraductions', this.otherTraductions);

        if (!this.otherTraductions.length) {
          return;
        }

        // If duplicate, remove the one not selected
        const selectedOne = _.find(this.otherTraductions, i => i.selected && i.current);
        if (selectedOne) _.remove(this.otherTraductions, i => i.selected && !i.current);

        this.otherTraductions = _.uniqBy(this.otherTraductions, i => i.href);

        // If only one item selected => Current one, no need to keep it
        if (this.otherTraductions.length === 1 && _.find(this.otherTraductions, i => i.selected)) {
          this.otherTraductions = [];
        }
      })
      .catch(err => {
        console.error(err);
        this.notification.error(err.message || err);
        this.wordTraductions = [];
      });
  }

  onWordClick(word: DicoWord) {
    this.selectedWord.en = `${word.en} ${word.phonetique} ${word.formeFlechie}`.trim();
    this.selectedWord.audio = word.audio;
    this.selectedWord.type = word.mapWordType(WordTypeMapType.short);
  }

  async onTraductionClick(traduction: Traduction) {
    // locution => audio
    if (traduction.subExpressions.length || traduction.locution) {
      const audio = traduction.audio;
      if (audio && !this.fetchAudio) {
        const blobURL = await this.audioService.loadAudio(audio);
        if (blobURL) {
          await this.audioService.playAudio(blobURL);
        } else {
          this.fetchAudio = audio;
          const data = await this.audioService.fetchAudio(audio);
          if (data) {
            this.audioService.saveAudio(audio, data);
            await this.audioService.playAudio(data);
          }
        }
        this.fetchAudio = undefined;
      }
      return;
    }

    // Renvois
    if (traduction.lien) {
      this.wordTraductions = null;
      this.load(traduction.lien, traduction.traduction);
      return;
    }

    const frSplit = _.map(this.selectedWord.fr.split(','), s => s.trim());
    const tradSplit = _.map([traduction.indicateur.trim(), traduction.traduction.trim()].join(' ').split(','), s => s.trim());
    _.forEach(tradSplit, t => {
      if (frSplit.includes(t)) return;
      frSplit.push(t);
    });
    this.selectedWord.fr = _.compact(frSplit).join(', ');
  }

  async onOtherTraductionPopoverClick(ev: any) {
    this.popover = await this.popoverController.create({
      component: OtherTraductionPopoverComponent,
      componentProps: {
        otherTraductionList: this.otherTraductions,
        dismiss: (item: OtherTraduction) => {
          this.wordTraductions = null;
          this.otherTraductions = null;
          this.load(item.href, item.word);
          this.selectedWord.href = item.href;
          this.popover.dismiss();
        },
      },
      event: ev,
      translucent: true,
    });
    return await this.popover.present();
  }
}
