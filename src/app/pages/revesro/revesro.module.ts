import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RevesroPageRoutingModule } from './revesro-routing.module';

import { RevesroPage } from './revesro.page';
import { PipesModule } from 'src/app/pipes/pipe.module';

@NgModule({
  imports: [PipesModule, CommonModule, FormsModule, IonicModule, RevesroPageRoutingModule],
  declarations: [RevesroPage],
})
export class RevesroPageModule {}
