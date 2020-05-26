import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { dicoList } from "../services/word.service";

@Injectable({
  providedIn: "root",
})
export class FolderGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const folder = localStorage.getItem("folder");
    if (dicoList[folder]) {
      this.router.navigateByUrl("folder/" + folder);
    } else {
      const defaultFolder = Object.keys(dicoList)[0];
      this.router.navigateByUrl("folder/" + defaultFolder);
    }
    return false;
  }
}
