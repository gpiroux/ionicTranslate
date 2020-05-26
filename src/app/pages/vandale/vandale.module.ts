import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { VandalePageRoutingModule } from "./vandale-routing.module";

import { VandalePage } from "./vandale.page";
import { PipesModule } from "src/app/pipes/pipe.module";

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    FormsModule,
    IonicModule,
    VandalePageRoutingModule,
  ],
  declarations: [VandalePage],
})
export class VandalePageModule {}
