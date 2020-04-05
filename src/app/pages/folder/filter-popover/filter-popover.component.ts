import { Component, OnInit } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { NavParams } from '@ionic/angular';

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
})
export class FilterPopoverComponent implements OnInit {
  searchString: string
  
  constructor(
    private wordService: WordService,
    private navParams: NavParams
  ) { 
    this.searchString = this.navParams.get('searchString');
  }

  ngOnInit() {
  }

  onRandomToggleChange(event) {
    this.wordService.isFilterRandom = event.detail.checked;
    this.wordService.search$.next(this.searchString)
  }

}
