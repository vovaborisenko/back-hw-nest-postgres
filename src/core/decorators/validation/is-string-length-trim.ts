import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Trim } from '../transform/trim';

export function IsStringLengthTrim(
  minLength: number = 0,
  maxLength: number = Infinity,
) {
  return applyDecorators(IsString(), Length(minLength, maxLength), Trim());
}
