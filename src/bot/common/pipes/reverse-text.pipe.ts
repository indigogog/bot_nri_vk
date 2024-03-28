import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ReverseTextPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }
    return value.split('').reverse().join('');
  }
}
