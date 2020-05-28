import { Pipe, PipeTransform } from '@angular/core';

import { firestore } from 'firebase';
import { DicoWord } from '../models/dicoResult.model';
import { CategoryMapType } from '../models/word.model';

@Pipe({
  name: 'join',
})
export class JoinPipe implements PipeTransform {
  transform(value: string[], delimiter = ' '): string {
    return (value || []).join(delimiter);
  }
}

@Pipe({
  name: 'wordTypeMap',
})
export class WordTypeMapPipe implements PipeTransform {
  transform(value: DicoWord): string {
    return value.mapWordType(CategoryMapType.long);
  }
}

@Pipe({
  name: 'firebaseDate',
})
export class FirebaseDatePipe implements PipeTransform {
  transform(value: firestore.Timestamp, ...args: any[]): Date {
    return value && value.toDate && value.toDate();
  }
}

@Pipe({
  name: 'highlight',
})
export class HighlightPipe implements PipeTransform {
  transform(value: string): string {
    const re1 = new RegExp(/\([^\(\)]*\)/, 'gi');
    const re2 = new RegExp(/\[[^\[\]]*\]/, 'gi');
    return value.replace(re1, '<mark>$&</mark>').replace(re2, '<mark>$&</mark>');
  }
}
