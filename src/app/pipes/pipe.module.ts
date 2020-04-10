import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { JoinPipe, FirebaseDatePipe, WordTypeMapPipe } from "./pipes";

@NgModule({
  imports: [IonicModule],
  exports: [JoinPipe, FirebaseDatePipe, WordTypeMapPipe],
  declarations: [JoinPipe, FirebaseDatePipe, WordTypeMapPipe],
})
export class PipesModule {}