import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PipesModule } from 'src/app/pipes/pipe.module'
import { IonicModule } from '@ionic/angular';
import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    FormsModule,
    IonicModule,
    FolderPageRoutingModule
  ],
  entryComponents: [FilterPopoverComponent],
  declarations: [FolderPage, FilterPopoverComponent]
})
export class FolderPageModule {}
