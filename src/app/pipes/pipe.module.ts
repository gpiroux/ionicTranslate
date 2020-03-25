import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { JoinPipe } from "./pipes";

@NgModule({
  declarations: [JoinPipe],
  imports: [IonicModule],
  exports: [JoinPipe]
})
export class PipesModule {}