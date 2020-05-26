import { Component, OnInit, Input } from "@angular/core";
import { NavParams } from "@ionic/angular";
import { OtherTraduction } from "src/app/models/dicoResult.model";

@Component({
  selector: "app-other-traduction-popover",
  templateUrl: "./other-traduction-popover.component.html",
  styleUrls: ["./other-traduction-popover.component.scss"],
})
export class OtherTraductionPopoverComponent implements OnInit {
  @Input() dismiss: (link: string) => {};
  @Input() otherTraductionList: OtherTraduction[];

  constructor() {}

  onClick(item: OtherTraduction) {
    this.dismiss(item.href);
  }

  ngOnInit() {}
}
