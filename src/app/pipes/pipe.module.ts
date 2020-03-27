import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { JoinPipe, FirebaseDate } from "./pipes";

@NgModule({
  imports: [IonicModule],
  exports: [JoinPipe, FirebaseDate],
  declarations: [JoinPipe, FirebaseDate],
})
export class PipesModule {}