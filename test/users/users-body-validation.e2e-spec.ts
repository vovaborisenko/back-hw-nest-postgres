import request from 'supertest';
import { validAuth } from '../constants/common';
import { userDto } from '../utils/user/user.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('Users API body validation', () => {
  let nestApp: INestApplication<App>;
  let app: App;
  let storage;

  beforeAll(async () => {
    const result = await initTestApp();

    nestApp = result.nestApp;
    app = result.httpServer;
    storage = result.throttlerStorage;
  });

  afterAll(async () => {
    await nestApp!.close();
  });

  beforeEach(async () => {
    await storage._storage.clear();
    await deleteAllData(app);
  });

  const longPassword = 'asff-awf+asws@ASDf$f#';

  describe(`POST ${FULL_PATH.USERS}`, () => {
    it.each`
      field         | value             | message
      ${'login'}    | ${null}           | ${'login must be a string'}
      ${'login'}    | ${5}              | ${'login must be a string'}
      ${'login'}    | ${''}             | ${'login must be longer than or equal to 3 characters'}
      ${'login'}    | ${'   '}          | ${'login must be longer than or equal to 3 characters'}
      ${'login'}    | ${'ar '}          | ${'login must be longer than or equal to 3 characters'}
      ${'login'}    | ${'ar-23_ZvtV45'} | ${'login must be shorter than or equal to 10 characters'}
      ${'login'}    | ${'ar-23+vtV'}    | ${'login must match /^[a-z0-9_-]*$/i regular expression'}
      ${'email'}    | ${null}           | ${'email must be a string'}
      ${'email'}    | ${5}              | ${'email must be a string'}
      ${'email'}    | ${''}             | ${'email must be longer than or equal to 5 characters'}
      ${'email'}    | ${'   '}          | ${'email must be longer than or equal to 5 characters'}
      ${'email'}    | ${'w@w.s'}        | ${'email must match /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i regular expression'}
      ${'email'}    | ${'w$@w.s_u'}     | ${'email must match /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i regular expression'}
      ${'email'}    | ${'ar-23_ZvfrtV'} | ${'email must match /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i regular expression'}
      ${'password'} | ${null}           | ${'password must be a string'}
      ${'password'} | ${5}              | ${'password must be a string'}
      ${'password'} | ${''}             | ${'password must be longer than or equal to 6 characters'}
      ${'password'} | ${'   '}          | ${'password must be longer than or equal to 6 characters'}
      ${'password'} | ${' dfe@#  '}     | ${'password must be longer than or equal to 6 characters'}
      ${'password'} | ${longPassword}   | ${'password must be shorter than or equal to 20 characters'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(FULL_PATH.USERS)
          .set('Authorization', validAuth)
          .send({ ...userDto.create[0], [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });
});
