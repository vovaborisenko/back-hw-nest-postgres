import { Matches } from 'class-validator';
import { EMAIL_REG_EXP } from '../../../../core/constants/reg-exp';
import { IsStringLengthTrim } from '../../../../core/decorators/validation/is-string-length-trim';
import { RegistrationEmailResendingDto } from '../../dto/registration-email-resending.dto';

export class RegistrationEmailResendingInputDto implements RegistrationEmailResendingDto {
  @Matches(EMAIL_REG_EXP)
  @IsStringLengthTrim(5)
  email: string;
}
