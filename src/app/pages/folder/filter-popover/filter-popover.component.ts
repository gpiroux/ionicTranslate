import { Component, OnInit, Input } from '@angular/core';
import { WordService } from 'src/app/services/word.service';

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
})
export class FilterPopoverComponent implements OnInit {
  @Input() dismiss: (val: boolean, cat: string) => {};
  @Input() isFilterRandom: boolean;
  @Input() categoryFilter:string;

  constructor(public wordService: WordService) {}

  ngOnInit() {}

  onRandomToggleChange(event) {
    this.dismiss(event.detail.checked, null);
  }

  onCategoryClick(event, cat) {
    this.dismiss(false, cat);
  }

}
