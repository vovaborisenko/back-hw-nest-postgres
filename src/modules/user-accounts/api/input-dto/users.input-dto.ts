import { CreateUserDto } from '../../dto/create-user.dto';
import { IsStringLengthTrim } from '../../../../core/decorators/validation/is-string-length-trim';
import { Matches } from 'class-validator';
import {
  EMAIL_REG_EXP,
  LOGIN_REG_EXP,
} from '../../../../core/constants/reg-exp';

export class CreateUserInputDto implements CreateUserDto {
  @Matches(LOGIN_REG_EXP)
  @IsStringLengthTrim(3, 10)
  login: string;

  @Matches(EMAIL_REG_EXP)
  @IsStringLengthTrim(5)
  email: string;

  @IsStringLengthTrim(6, 20)
  password: string;
}
