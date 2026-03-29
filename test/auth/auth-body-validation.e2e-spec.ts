import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';
import { PasswordRecoveryInputDto } from '../../src/modules/user-accounts/api/input-dto/password-recovery.input-dto';

describe('Auth API body validation', () => {
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

  const loginData = {
    loginOrEmail: 'ask@rest.com',
    password: 'some#Strict@pass',
  };

  describe.skip(`POST ${FULL_PATH.LOGIN}`, () => {
    it.each`
      field             | value    | message
      ${'loginOrEmail'} | ${null}  | ${'loginOrEmail must be a string'}
      ${'loginOrEmail'} | ${5}     | ${'loginOrEmail must be a string'}
      ${'loginOrEmail'} | ${''}    | ${'Length of loginOrEmail should be between 1 and Infinity'}
      ${'loginOrEmail'} | ${'   '} | ${'Length of loginOrEmail should be between 1 and Infinity'}
      ${'password'}     | ${null}  | ${'password must be a string'}
      ${'password'}     | ${5}     | ${'password must be a string'}
      ${'password'}     | ${''}    | ${'Length of password should be between 1 and Infinity'}
      ${'password'}     | ${'   '} | ${'Length of password should be between 1 and Infinity'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(`${FULL_PATH.LOGIN}`)
          .send({ ...loginData, [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`POST ${FULL_PATH.NEW_PASSWORD}`, () => {
    const newPassword = {
      recoveryCode: 'ask-rest-com',
      newPassword: 'some#Strict@pass',
    };

    it.each`
      field             | value                      | message
      ${'recoveryCode'} | ${null}                    | ${'recoveryCode must be a UUID'}
      ${'recoveryCode'} | ${5}                       | ${'recoveryCode must be a UUID'}
      ${'recoveryCode'} | ${''}                      | ${'recoveryCode must be a UUID'}
      ${'recoveryCode'} | ${'   '}                   | ${'recoveryCode must be a UUID'}
      ${'newPassword'}  | ${null}                    | ${'newPassword must be a string'}
      ${'newPassword'}  | ${5}                       | ${'newPassword must be a string'}
      ${'newPassword'}  | ${''}                      | ${'newPassword must be longer than or equal to 6 characters'}
      ${'newPassword'}  | ${'   '}                   | ${'newPassword must be longer than or equal to 6 characters'}
      ${'newPassword'}  | ${'somew'}                 | ${'newPassword must be longer than or equal to 6 characters'}
      ${'newPassword'}  | ${'someVeryLongPassworda'} | ${'newPassword must be shorter than or equal to 20 characters'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(`${FULL_PATH.NEW_PASSWORD}`)
          .send({ ...newPassword, [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`POST ${FULL_PATH.PASSWORD_RECOVERY}`, () => {
    const dto: PasswordRecoveryInputDto = {
      email: 'ask@rest.com',
    };

    it.each`
      field      | value             | message
      ${'email'} | ${5}              | ${'email must be a string'}
      ${'email'} | ${''}             | ${'email must be longer than or equal to 5 characters'}
      ${'email'} | ${'   '}          | ${'email must be longer than or equal to 5 characters'}
      ${'email'} | ${'w$@w.s_u'}     | ${'email must match /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i regular expression'}
      ${'email'} | ${'ar-23_ZvfrtV'} | ${'email must match /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i regular expression'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(`${FULL_PATH.PASSWORD_RECOVERY}`)
          .send({ ...dto, [field]: value })
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
