import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { DetailPageRoutingModule } from "./detail-routing.module";

import { DetailPage } from "./detail.page";
import { PipesModule } from "src/app/pipes/pipe.module";

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    FormsModule,
    IonicModule,
    DetailPageRoutingModule,
  ],
  declarations: [DetailPage],
})
export class DetailPageModule {}
