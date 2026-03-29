import { Transform, TransformFnParams } from 'class-transformer';

export function Trim() {
  return Transform(({ value }: TransformFnParams) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return typeof value === 'string' ? value.trim() : value;
  });
}
