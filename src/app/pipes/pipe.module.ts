import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import {
  JoinPipe,
  FirebaseDatePipe,
  WordTypeMapPipe,
  HighlightPipe,
} from "./pipes";

@NgModule({
  imports: [IonicModule],
  exports: [JoinPipe, FirebaseDatePipe, WordTypeMapPipe, HighlightPipe],
  declarations: [JoinPipe, FirebaseDatePipe, WordTypeMapPipe, HighlightPipe],
})
export class PipesModule {}
