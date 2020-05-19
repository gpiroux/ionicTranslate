import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { Word } from '../../models/word.model';
import { WordService, Dico, dicoList } from '../../services/word.service';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

import * as _ from 'lodash';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FolderPage implements OnInit {
  public displayedWords: Word[] = [];
  public searchString: string = '';
  public dico: Dico;

  private popover: HTMLIonPopoverElement;
  private destroy$: Subject<void> = new Subject();
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private popoverController: PopoverController
  ) {}

  async ngOnInit() {
    console.log('Page ngOnInit')
    const dicoName = this.activatedRoute.snapshot.paramMap.get('dicoName');
    this.dico = dicoList[dicoName];

    
    await this.wordService.initialise(this.dico);
    localStorage.setItem('folder', dicoName);

    combineLatest(this.wordService.words$, this.wordService.searchedWords$, this.wordService.randomWords$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([words, searchWords, randomWords]) => {
        console.log('combineLatest')
        this.displayedWords = this.searchString 
          ? searchWords 
          : this.isFilterRandom
            ? randomWords
            : words
        this.wordService.displayedWords = this.displayedWords;
      });
  }

  ngOnDestroy(): void {
    console.log('Page ngOnDestroy')
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isFilterRandom() {
    return this.wordService.isFilterRandom;
  }

  set isFilterRandom(val) {
    this.wordService.isFilterRandom = val;
  }

  trackByFn(index: number, item: Word) {
    return item.id;
  }

  async onFilterPopoverClick(ev: any) {
    this.popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      componentProps: { 
        dismiss: (isFilterRandom: boolean) => {
          this.isFilterRandom = isFilterRandom;
          if (isFilterRandom) 
            this.wordService.random$.next(null)
          else 
            this.wordService.search$.next(this.searchString)
          this.popover.dismiss();
        }
      },
      event: ev,
      translucent: true
    });
    return await this.popover.present();
  }

  onReloadClick() {
    this.wordService.random$.next(null);
  }

  onSearchChange(event) {
    this.searchString = event.target.value || '';
    this.wordService.search$.next(this.searchString.toLowerCase());
  }

  onUpdateTime(item: Word) {
    this.wordService.updateWord(item);
  }

  onDelete(item: Word) {
    this.wordService.deleteWord(item.id);
  }
}