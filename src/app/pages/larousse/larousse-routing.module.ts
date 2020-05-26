import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";

import { LaroussePage } from "./larousse.page";

const routes: Routes = [
  {
    path: "",
    component: LaroussePage,
  },
];

@NgModule({
  imports: [HttpClientModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaroussePageRoutingModule {}
