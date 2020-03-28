import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaroussePage } from './larousse.page';

const routes: Routes = [
  {
    path: '',
    component: LaroussePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaroussePageRoutingModule {}
