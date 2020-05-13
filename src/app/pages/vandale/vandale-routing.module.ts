import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { VandalePage } from './vandale.page';

const routes: Routes = [
  {
    path: '',
    component: VandalePage
  }
];

@NgModule({
  imports: [
    HttpClientModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
})
export class VandalePageRoutingModule {}
