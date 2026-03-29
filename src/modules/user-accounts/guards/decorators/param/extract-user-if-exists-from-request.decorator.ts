import { createParamDecorator } from '@nestjs/common';
import { isUserContextDto, UserContextDto } from '../../dto/user-context.dto';

export const ExtractUserIfExistsFromRequestDecorator = createParamDecorator<
  void,
  UserContextDto | null
>((_, context) => {
  const { user } = context.switchToHttp().getRequest<{ user?: unknown }>();

  return isUserContextDto(user) ? user : null;
});
