import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { RevesroPage } from './revesro.page';

const routes: Routes = [
  {
    path: '',
    component: RevesroPage,
  },
];

@NgModule({
  imports: [HttpClientModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RevesroPageRoutingModule {}
