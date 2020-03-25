import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'join'
})
export class JoinPipe implements PipeTransform {
  transform(value: string[], ...args: any[]): any {
    return value.join(', ');
  }
}

@Pipe({
  name: 'array'
})
export class ArrayPipe implements PipeTransform {
  transform(value: string, ...args: any[]): any {
    return value.split(', ');
  }
}