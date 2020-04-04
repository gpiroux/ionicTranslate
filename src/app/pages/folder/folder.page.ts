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
  }

  async onFilterPopoverClick(ev: any) {
    const popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      event: ev,
      translucent: true
    });
    return await popover.present();
  }

  onSearchChange(event) {
    this.searchString = event.target.value;
    if (this.searchString.length == 0) {
      this.wordService.search$.next(null);
    } else if (this.searchString.length >= 3) {
      this.wordService.search$.next(
        {search: this.searchString.toLowerCase(), filterType: FilterType.enSearch});
    }
  }

  onUpdateTime(item: Word) {
    this.wordService.updateWord(item);
  }

  onDelete(item: Word) {
    this.wordService.deleteWord(item.id);
  }

}