import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { DomainException } from '../exceptions/domain-exceptions';
import { DomainExceptionCode } from '../exceptions/domain-exception-code';

@Injectable()
export class ObjectIdValidationTransformationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.metatype !== Types.ObjectId) {
      return value;
    }

    if (!isValidObjectId(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Invalid ObjectId: ${value}`,
      });
    }
    return new Types.ObjectId(value);
  }
}

/**
 * Not add it globally. Use only locally
 */
@Injectable()
export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: any): any {
    // Проверяем, что тип данных в декораторе — ObjectId

    if (!isValidObjectId(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Invalid ObjectId: ${value}`,
      });
    }

    // Если тип не ObjectId, возвращаем значение без изменений
    return value;
  }
}
