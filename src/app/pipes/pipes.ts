import { Pipe, PipeTransform } from '@angular/core';
import { firestore } from 'firebase';

@Pipe({
  name: 'join'
})
export class JoinPipe implements PipeTransform {
  transform(value: string[], ...args: any[]): any {
    return value.join(', ');
  }
}

@Pipe({
  name: 'firebaseDate'
})
export class FirebaseDate implements PipeTransform {
  transform(value: firestore.Timestamp, ...args: any[]): any {
    return value && value.toDate()
  }
}