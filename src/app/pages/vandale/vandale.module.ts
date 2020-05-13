import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VandalePageRoutingModule } from './vandale-routing.module';

import { VandalePage } from './vandale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VandalePageRoutingModule
  ],
  declarations: [VandalePage]
})
export class VandalePageModule {}
