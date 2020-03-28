import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaroussePageRoutingModule } from './larousse-routing.module';

import { LaroussePage } from './larousse.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaroussePageRoutingModule
  ],
  declarations: [LaroussePage]
})
export class LaroussePageModule {}
