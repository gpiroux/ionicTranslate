import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { LogoutGuard } from './guards/logout.guard';
import { FolderGuard } from './guards/folder.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'logout',
    canActivate: [LogoutGuard],
    component: class DummyComponent {},
  },
  {
    path: 'folder',
    canActivate: [FolderGuard],
    component: class DummyComponent {},
  },
  {
    path: 'folder/:dicoName',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/folder/folder.module').then(m => m.FolderPageModule),
  },
  {
    path: 'revesro',
    loadChildren: () => import('./pages/revesro/revesro.module').then(m => m.RevesroPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'legacy' })],
  providers: [AuthGuard, LogoutGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
