import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class BasePathParamsInputDto {
  @IsMongoId()
  id: Types.ObjectId;
}
