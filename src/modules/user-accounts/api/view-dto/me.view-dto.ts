import { User } from '../../domain/user.entity';

export class MeViewDto {
  email: string;
  login: string;
  userId: string;

  static mapToView(user: User): MeViewDto {
    const dto = new MeViewDto();

    dto.userId = user.id.toString();
    dto.email = user.email;
    dto.login = user.login;

    return dto;
  }
}
