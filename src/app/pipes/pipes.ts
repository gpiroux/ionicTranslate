import { Pipe, PipeTransform } from '@angular/core';
import { firestore } from 'firebase';
import { DicoWord } from '../models/dicoResult.model';
import { CategoryMapType } from '../models/word.model';

@Pipe({
  name: 'join'
})
export class JoinPipe implements PipeTransform {
  transform(value: string[], ...args: any[]): any {
    return (value || []).join(args[0] || ' ');
  }
}

@Pipe({
  name: 'wordTypeMap'
})
export class WordTypeMapPipe implements PipeTransform {
  transform(value: DicoWord, ...args: any[]): any {
      return value.mapWordType(CategoryMapType.long);
  }
}

@Pipe({
  name: 'firebaseDate'
})
export class FirebaseDatePipe implements PipeTransform {
  transform(value: firestore.Timestamp, ...args: any[]): any {
      return value && value.toDate && value.toDate()
  }
}