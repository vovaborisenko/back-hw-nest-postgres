import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { validAuth } from '../../constants/common';
import { extractCookies } from '../cookies/cookies';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { CreateUserInputDto } from '../../../src/modules/user-accounts/api/input-dto/users.input-dto';
import { FULL_PATH } from '../../../src/core/constants/paths';

export const userDto: { create: CreateUserInputDto[] } = {
  create: [
    {
      login: 'myLogin',
      email: 'ask@rest.com',
      password: 'some#Strict@pass',
    },
    {
      login: 'Login2',
      email: 'seek@opt.de',
      password: 'pass)(ssap',
    },
  ],
};
export const USER_AGENTS = [
  // Chrome
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',

  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',

  // Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',

  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

  // Android
  'Mozilla/5.0 (Linux; Android 14; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36',
];

export async function createUser(
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
): Promise<UserViewDto> {
  const { body: user } = await request(app)
    .post(FULL_PATH.USERS)
    .set('Authorization', validAuth)
    .send(dto)
    .expect(HttpStatus.CREATED);

  return user as UserViewDto;
}

export async function createUsers(
  count: number,
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
): Promise<UserViewDto[]> {
  const requests = Array.from({ length: count }).map((_, index) =>
    createUser(app, {
      login: `${dto.login}${index}`,
      email: `${index}${dto.email}`,
      password: `${dto.password}${index}`,
    }),
  );

  return Promise.all(requests);
}

export async function loginUser(
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
  userAgent: string = USER_AGENTS[0],
): Promise<{ token: string; refreshToken: string }> {
  const response = await request(app)
    .post(FULL_PATH.LOGIN)
    .set('User-Agent', userAgent)
    .send({
      loginOrEmail: dto.login,
      password: dto.password,
    })
    .expect(HttpStatus.OK);

  const { refreshToken } = extractCookies(response);

  return {
    token: response.body.accessToken,
    refreshToken,
  };
}

export async function loginUserWithDifferentUserAgent(
  count: number,
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
): Promise<{ token: string; refreshToken: string }[]> {
  const requests = Array.from({ length: count }).map((_, index) =>
    loginUser(app, dto, USER_AGENTS[index]),
  );

  return Promise.all(requests);
}

export async function createUserAndLogin(
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
  userAgent: string = USER_AGENTS[0],
): Promise<{ user: UserViewDto; token: string; refreshToken: string }> {
  const user = await createUser(app, dto);
  const tokens = await loginUser(app, dto, userAgent);

  return {
    user,
    ...tokens,
  };
}

export async function createUsersAndLogin(
  count: number,
  app: App,
  dto: CreateUserInputDto = userDto.create[0],
  userAgent: string = USER_AGENTS[0],
): Promise<{ user: UserViewDto; token: string; refreshToken: string }[]> {
  const requests = Array.from({ length: count }).map(async (_, index) => {
    const userDto = {
      login: `${dto.login}${index}`,
      email: `${index}${dto.email}`,
      password: `${dto.password}${index}`,
    };
    const user = await createUser(app, userDto);
    const tokens = await loginUser(app, userDto, userAgent);

    return {
      user,
      ...tokens,
    };
  });

  return Promise.all(requests);
}
