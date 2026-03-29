import type { UserRaw } from '../../domain/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: UserRaw): UserViewDto {
    const dto = new UserViewDto();

    dto.id = user.id.toString();
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.created_at.toISOString();

    return dto;
  }
}
