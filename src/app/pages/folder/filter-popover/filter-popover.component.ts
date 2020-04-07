import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
})
export class FilterPopoverComponent implements OnInit {
  @Input() isFilterRandom: boolean;
  @Input() dismiss: (val: boolean) => {}
  
  constructor() {}

  ngOnInit() {}

  onRandomToggleChange(event) {
    this.dismiss(event.detail.checked);
  }

}
