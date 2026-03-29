import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { validAuth } from '../constants/common';
import { createUser, createUserAndLogin } from '../utils/user/user.util';
import { extractCookies } from '../utils/cookies/cookies';
import { wait } from '../utils/core/wait';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('Auth Controller (e2e)', () => {
  let nestApp: INestApplication<App>;
  let app: App;

  beforeEach(async () => {
    const result = await initTestApp();

    nestApp = result.nestApp;
    app = result.httpServer;

    await deleteAllData(app);
  });

  afterEach(async () => {
    await nestApp!.close();
  });

  describe(`POST ${FULL_PATH.LOGIN}`, () => {
    it('should return 401 if login or password is wrong', async () => {
      await request(app)
        .post(FULL_PATH.LOGIN)
        .send({
          loginOrEmail: 'loginOrEmail',
          password: 'password',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200, refreshToken and accessToken when credentials is right', async () => {
      const { user, token, refreshToken } = await createUserAndLogin(app);

      expect(new JwtService().decode(token)?.id).toBe(user.id);
      expect(new JwtService().decode(refreshToken)?.id).toBe(user.id);
    });
  });

  describe(`POST ${FULL_PATH.NEW_PASSWORD}`, () => {
    it('should return 400 if recovery code is wrong', async () => {
      await request(app)
        .post(FULL_PATH.NEW_PASSWORD)
        .send({
          recoveryCode: 'recovery-code',
          newPassword: 'password',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe(`POST ${FULL_PATH.PASSWORD_RECOVERY}`, () => {
    it('should return 204 if no user with current email', async () => {
      await request(app)
        .post(FULL_PATH.PASSWORD_RECOVERY)
        .send({
          email: 'some@valid.email',
        })
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 204 if user with current email', async () => {
      const { email } = await createUser(app);

      await request(app)
        .post(FULL_PATH.PASSWORD_RECOVERY)
        .send({
          email,
        })
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe(`GET ${FULL_PATH.ME}`, () => {
    it('should return 401 if accessToken is not exist', async () => {
      await request(app).get(FULL_PATH.ME).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if accessToken is wrong', async () => {
      await request(app)
        .get(FULL_PATH.ME)
        .set('Authorization', 'Bearer accessToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if accessToken is right but user is deleted', async () => {
      const { user, token } = await createUserAndLogin(app);

      await request(app)
        .delete(`${FULL_PATH.USERS}/${user.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);

      await request(app)
        .get(FULL_PATH.ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200 and me view model if accessToken is correct', async () => {
      const { user, token } = await createUserAndLogin(app);

      const { body: me } = await request(app)
        .get(FULL_PATH.ME)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(me).toEqual({
        userId: user.id,
        login: user.login,
        email: user.email,
      });
    });
  });

  describe(`POST ${FULL_PATH.REFRESH_TOKEN}`, () => {
    it('should return 401 if refreshToken is not exist', async () => {
      await request(app)
        .post(FULL_PATH.REFRESH_TOKEN)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refreshToken is wrong', async () => {
      await request(app)
        .post(FULL_PATH.REFRESH_TOKEN)
        .set('Cookie', 'refreshToken=refreshToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200 and new tokens if refreshToken is correct', async () => {
      const { user, refreshToken, token } = await createUserAndLogin(app);

      await wait(1000);

      const response = await request(app)
        .post(FULL_PATH.REFRESH_TOKEN)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.OK);

      const cookies = extractCookies(response);

      expect(response.body.accessToken).not.toBe(token);
      expect(cookies.refreshToken).not.toBe(refreshToken);
      expect(new JwtService().decode(response.body.accessToken)?.id).toBe(
        user.id,
      );
      expect(new JwtService().decode(cookies.refreshToken)?.id).toBe(user.id);
    });

    it('should return 401 on second request with the same token', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      await wait(1000);

      await request(app)
        .post(FULL_PATH.REFRESH_TOKEN)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.OK);
      await request(app)
        .post(FULL_PATH.REFRESH_TOKEN)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe(`POST ${FULL_PATH.LOGOUT}`, () => {
    it('should return 401 if refreshToken is not exist', async () => {
      await request(app).post(FULL_PATH.LOGOUT).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refreshToken is wrong', async () => {
      await request(app)
        .post(FULL_PATH.LOGOUT)
        .set('Cookie', 'refreshToken=refreshToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 204 refreshToken is correct', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      await request(app)
        .post(FULL_PATH.LOGOUT)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 401 on second request', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      await request(app)
        .post(FULL_PATH.LOGOUT)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .post(FULL_PATH.LOGOUT)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe(`POST ${FULL_PATH.REG_CONFIRMATION}`, () => {
    it('should return 400 if code not exist', async () => {
      await request(app)
        .post(FULL_PATH.REG_CONFIRMATION)
        .send({
          code: 'loginOrEmail',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 200 and accessToken when credentials is right', async () => {
      const { user, token } = await createUserAndLogin(app);

      // @ts-ignore
      expect(new JwtService().decode(token)?.id).toBe(user.id);
    });
  });

  describe(`Too many attempts`, () => {
    const period = Number(process.env.RATE_LIMIT_PERIOD) || 1e3;

    it.each`
      path                             | maxAttempts | expectedCode
      ${FULL_PATH.LOGIN}               | ${5}        | ${HttpStatus.UNAUTHORIZED}
      ${FULL_PATH.NEW_PASSWORD}        | ${5}        | ${HttpStatus.BAD_REQUEST}
      ${FULL_PATH.PASSWORD_RECOVERY}   | ${5}        | ${HttpStatus.BAD_REQUEST}
      ${FULL_PATH.REG_CONFIRMATION}    | ${5}        | ${HttpStatus.BAD_REQUEST}
      ${FULL_PATH.REG_EMAIL_RESENDING} | ${5}        | ${HttpStatus.BAD_REQUEST}
      ${FULL_PATH.REGISTRATION}        | ${5}        | ${HttpStatus.BAD_REQUEST}
    `(
      `should return 429 POST $path more than $maxAttempts attempts`,
      async ({ path, maxAttempts, expectedCode }) => {
        await runTest();

        // after 10sec has more attempts
        await wait(period);
        await runTest();

        async function runTest() {
          for (let i = 1; i <= maxAttempts + 1; i++) {
            await request(app)
              .post(path)
              .send()
              .expect(
                i > maxAttempts ? HttpStatus.TOO_MANY_REQUESTS : expectedCode,
              );
          }
        }
      },
      period + 5000, // Таймаут = период ожидания + запас
    );
  });
});
