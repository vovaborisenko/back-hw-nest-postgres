import { createParamDecorator } from '@nestjs/common';
import { isUserContextDto, UserContextDto } from '../../dto/user-context.dto';

export const ExtractUserFromRequestDecorator = createParamDecorator<
  void,
  UserContextDto
>((_, context) => {
  const { user } = context.switchToHttp().getRequest<{ user?: unknown }>();

  if (!isUserContextDto(user)) {
    throw new Error('there is no user in the request object. Add guard');
  }

  return user;
});
