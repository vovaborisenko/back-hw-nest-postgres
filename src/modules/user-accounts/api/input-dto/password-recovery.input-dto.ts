import { PasswordRecoveryDto } from '../../dto/password-recovery.dto';
import { Matches } from 'class-validator';
import { EMAIL_REG_EXP } from '../../../../core/constants/reg-exp';
import { IsStringLengthTrim } from '../../../../core/decorators/validation/is-string-length-trim';

export class PasswordRecoveryInputDto implements PasswordRecoveryDto {
  @Matches(EMAIL_REG_EXP)
  @IsStringLengthTrim(5)
  email: string;
}
