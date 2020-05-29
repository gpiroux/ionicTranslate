import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

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
  selectedWord: Word;
  strippedWord: string;
  currentHref: string;
  wordTraductions: DicoWord[];
  otherTraductions: OtherTraduction[];

  private popover: HTMLIonPopoverElement;
  public fetchAudio: string;

  constructor(
    private larousseService: LarousseService,
    private wordService: WordService,
    private popoverController: PopoverController,
    private notification: NotificationsService,
    private audioService: AudioService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWordEn = _.get(this.selectedWord, 'en');
    const selectedWordHref = _.get(this.selectedWord, 'href');

    if (selectedWordHref) {
      this.load(selectedWordHref);
    } else if (selectedWordEn) {
      this.strippedWord = selectedWordEn.trim().split(' ')[0].split('[')[0];
      this.currentHref = `dictionnaires/anglais-francais/${this.strippedWord}`;
      this.load(this.currentHref);
    } else {
      this.router.navigateByUrl('');
      this.notification.error('Pas de mot sélectionné !');
    }
  }

  async load(href: string) {
    this.larousseService
      .load(href)
      .then(result => {
        this.wordTraductions = result.dicoWords;

        this.otherTraductions = this.otherTraductions || [];
        this.otherTraductions.forEach(i => (i.selected = false));
        this.otherTraductions = this.otherTraductions.concat(result.otherTradutions);

        // Remove duplicate if any
        const selectedOne = _.find(this.otherTraductions, i => i.selected);
        if (selectedOne) _.remove(this.otherTraductions, i => !i.selected && i.word === selectedOne.word);
      })
      .catch(err => {
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
    if (traduction.traductionSubList.length || traduction.locution) {
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
      // Keep only the current one (example: 'check' vs 'cheque' from renvoi)
      this.otherTraductions = [
        {
          href: this.currentHref,
          word: this.strippedWord,
          selected: false,
        },
      ];
      this.wordTraductions = null;
      this.load(traduction.lien);
      return;
    }

    const frSplit = _.map(this.selectedWord.fr.split(','), s => s.trim());
    const tradSplit = _.map([traduction.indicateur, traduction.traduction].join(' ').split(','), s => s.trim());
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
        dismiss: (link: string) => {
          this.wordTraductions = null;
          this.otherTraductions = null;
          this.load(link);
          this.selectedWord.href = link;
          this.popover.dismiss();
        },
      },
      event: ev,
      translucent: true,
    });
    return await this.popover.present();
  }
}
