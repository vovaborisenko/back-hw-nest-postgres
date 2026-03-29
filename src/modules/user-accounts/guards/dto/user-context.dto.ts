export class UserContextDto {
  id: string;
}

export class RefreshTokenDto extends UserContextDto {
  deviceId: string;
  exp: number;
  iat: number;
}

export function isUserContextDto(user: unknown): user is UserContextDto {
  return !!user && typeof user === 'object' && 'id' in user;
}
