import { IsUUID } from 'class-validator';
import { IsStringLengthTrim } from '../../../../core/decorators/validation/is-string-length-trim';
import { PasswordUpdateDto } from '../../dto/password-update.dto';

export class PasswordUpdateInputDto implements PasswordUpdateDto {
  @IsStringLengthTrim(6, 20)
  newPassword: string;

  @IsUUID()
  recoveryCode: string;
}
