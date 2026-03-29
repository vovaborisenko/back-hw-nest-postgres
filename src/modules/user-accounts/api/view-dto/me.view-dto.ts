import { UserDocument } from '../../domain/user.entity';

export class MeViewDto {
  email: string;
  login: string;
  userId: string;

  static mapToView(user: UserDocument): MeViewDto {
    const dto = new MeViewDto();

    dto.userId = user._id.toString();
    dto.email = user.email;
    dto.login = user.login;

    return dto;
  }
}
