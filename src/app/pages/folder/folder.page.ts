import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PopoverController } from '@ionic/angular';

import { Word } from '../../models/word.model';
import { WordService, FilterType } from '../../services/word.service';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

import * as _ from 'lodash';

enum Direction {
  asc = 'asc',
  desc = 'desc'
}

interface OrderBy {
  key: string;
  direction: Direction; 
}

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss']
})
export class FolderPage implements OnInit {
  public folder: string;
  public words: Word[] = [];
  public searchString: string = '';
  public isFilterRandom: boolean;

  private popover: any

  constructor(
    private activatedRoute: ActivatedRoute, 
    private wordService: WordService,
    public popoverController: PopoverController
  ) { }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');

    console.log('ngOnInit');
    this.wordService.words$.subscribe(data => {
      this.words = data;
      this.wordService.lastWords = data;
    });

    this.isFilterRandom = this.wordService.isFilterRandom
  }


  async onFilterPopoverClick(ev: any) {
    this.popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      componentProps: { searchString: this.searchString },
      event: ev,
      translucent: true
    });
    this.popover.onWillDismiss().then(() => {
      this.isFilterRandom = this.wordService.isFilterRandom;
    })
    return await this.popover.present();
  }

  onReloadClick() {
    this.wordService.search$.next(null);
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