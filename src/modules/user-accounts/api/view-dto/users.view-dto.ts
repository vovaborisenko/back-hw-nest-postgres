import type { User } from '../../domain/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: User): UserViewDto {
    const dto = new UserViewDto();

    dto.id = user.id.toString();
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.createdAt.toISOString();

    return dto;
  }
}
