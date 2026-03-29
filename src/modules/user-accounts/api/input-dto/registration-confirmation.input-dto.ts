import { RegistrationConfirmationDto } from '../../dto/registration-confirmation.dto';
import { IsUUID } from 'class-validator';

export class RegistrationConfirmationInputDto implements RegistrationConfirmationDto {
  @IsUUID()
  code: string;
}
