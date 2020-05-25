import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { OtherTraductionPopoverComponent } from './other-traduction-popover/other-traduction-popover.component';

import { WordService } from 'src/app/services/word.service';
import { AudioService } from 'src/app/services/audio.service';
import { LarousseService } from 'src/app/services/larousse.service';
import { NotificationsService } from 'src/app/services/notifications.service';

import { Word, CategoryMapType as WordTypeMapType } from 'src/app/models/word.model';
import { DicoWord, OtherTraduction, Traduction } from 'src/app/models/dicoResult.model';

import * as _ from 'lodash'

@Component({
  selector: 'app-larousse',
  templateUrl: './larousse.page.html',
  styleUrls: ['./larousse.page.scss'],
})
export class LaroussePage implements OnInit {

  selectedWord: Word;
  wordTraductions: DicoWord[];
  otherTraductions: OtherTraduction[];

  private popover: any;
  public fetchAudio: number;

  constructor(
    private larousseService: LarousseService, 
    private wordService: WordService,
    private popoverController: PopoverController,
    private notification: NotificationsService,
    private audioService: AudioService
  ) { }

  async ngOnInit() {
    this.selectedWord = this.wordService.selectedWord;
    const selectedWordEn = _.get(this.selectedWord, 'en');
    const selectedWordHref = _.get(this.selectedWord, 'href');
    
    if (selectedWordHref) {
      this.load(selectedWordHref);
    } else if (selectedWordEn) {
      let strippedWord = selectedWordEn.trim().split(' ')[0].split('[')[0];
      this.load(`dictionnaires/anglais-francais/${strippedWord}`);
    } else {
      this.notification.error('Pas de mot sélectionné !');
    }
  }

  async load(href: string) {
    this.larousseService.load(href)
      .then(result => {
        this.wordTraductions = result.dicoWords;
        this.otherTraductions = result.otherTradutions;
      })
      .catch(err => {
        this.notification.error(err.message || err);
      });
  }

  onWordClick(word: DicoWord) {
    this.selectedWord.en = `${word.en} ${word.phonetique} ${word.formeFlechie}`.trim();
    this.selectedWord.audio = word.audio;
    this.selectedWord.type = word.mapWordType(WordTypeMapType.short);
  }

  async onTraductionClick(traduction: Traduction, idx: number) {
    if (traduction.tradList.length || traduction.locution) {
      const audio = traduction.audio;
      if (audio && !this.fetchAudio) {
        const blobURL = await this.audioService.loadAudio(audio)
        if (blobURL) {
          await this.audioService.playAudio(blobURL);
        } else {
          this.fetchAudio = idx;
          const data = await this.audioService.fetchAudio(audio);
          if (data) {
            this.audioService.saveAudio(audio , data);
            await this.audioService.playAudio(data);
          }
        }
        this.fetchAudio = undefined;
      }
      return;
    };

    const frSplit = _.map(this.selectedWord.fr.split(','), s => s.trim());
    const tradSplit = _.map(traduction.traduction.split(','), s => s.trim());
    _.forEach(tradSplit, t => {
      if (frSplit.includes(t)) return;
      frSplit.push(t)
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
          this.load(link);
          this.selectedWord.href = link;
          this.popover.dismiss();
        }
      },
      event: ev,
      translucent: true
    });
    return await this.popover.present();
  }
}
