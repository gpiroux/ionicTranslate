import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { LaroussePageRoutingModule } from "./larousse-routing.module";
import { PipesModule } from "src/app/pipes/pipe.module";

import { LaroussePage } from "./larousse.page";
import { OtherTraductionPopoverComponent } from "./other-traduction-popover/other-traduction-popover.component";

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    FormsModule,
    IonicModule,
    LaroussePageRoutingModule,
  ],
  entryComponents: [OtherTraductionPopoverComponent],
  declarations: [LaroussePage, OtherTraductionPopoverComponent],
})
export class LaroussePageModule {}
