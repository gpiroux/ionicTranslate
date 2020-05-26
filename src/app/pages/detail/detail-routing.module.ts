import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailPage } from './detail.page';

const routes: Routes = [
  {
    path: '',
    component: DetailPage,
  },
  {
    path: 'larousse',
    loadChildren: () => import('../larousse/larousse.module').then((m) => m.LaroussePageModule),
  },
  {
    path: 'vandale',
    loadChildren: () => import('../vandale/vandale.module').then((m) => m.VandalePageModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetailPageRoutingModule {}
