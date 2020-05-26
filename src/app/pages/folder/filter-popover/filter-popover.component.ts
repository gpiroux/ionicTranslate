import { Component, OnInit, Input } from "@angular/core";
import { WordService } from "src/app/services/word.service";

@Component({
  selector: "app-filter-popover",
  templateUrl: "./filter-popover.component.html",
  styleUrls: ["./filter-popover.component.scss"],
})
export class FilterPopoverComponent implements OnInit {
  @Input() dismiss: (val: boolean) => {};

  isFilterRandom: boolean;
  constructor(private wordService: WordService) {
    this.isFilterRandom = this.wordService.isFilterRandom;
  }

  ngOnInit() {}

  onRandomToggleChange(event) {
    this.dismiss(event.detail.checked);
  }
}
