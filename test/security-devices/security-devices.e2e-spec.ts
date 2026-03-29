import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import {
  createUser,
  createUserAndLogin,
  loginUserWithDifferentUserAgent,
  userDto,
} from '../utils/user/user.util';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('Security Devices API', () => {
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

  describe(`GET ${FULL_PATH.DEVICES}`, () => {
    it('should return 401 if no refresh token', async () => {
      await request(app).get(FULL_PATH.DEVICES).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refreshToken is wrong', async () => {
      await request(app)
        .get(FULL_PATH.DEVICES)
        .set('Cookie', 'refreshToken=refreshToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200 and deviceId is the same if refreshToken is right', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      const response = await request(app)
        .get(FULL_PATH.DEVICES)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.length).toBe(1);
      expect(new JwtService().decode(refreshToken)?.deviceId).toBe(
        response.body[0].deviceId,
      );
    });

    it('should return all users devices', async () => {
      await createUser(app, userDto.create[0]);
      const [{ refreshToken }] = await loginUserWithDifferentUserAgent(
        5,
        app,
        userDto.create[0],
      );

      const { body } = await request(app)
        .get(FULL_PATH.DEVICES)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.OK);

      expect(body.length).toBe(5);
    });
  });

  describe(`DELETE ${FULL_PATH.DEVICES}`, () => {
    it('should return 401 if no refresh token', async () => {
      await request(app)
        .delete(FULL_PATH.DEVICES)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refreshToken is wrong', async () => {
      await request(app)
        .delete(FULL_PATH.DEVICES)
        .set('Cookie', 'refreshToken=refreshToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 204 if refreshToken is right', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      await request(app)
        .delete(FULL_PATH.DEVICES)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should delete all users devices, except current', async () => {
      await createUser(app, userDto.create[0]);
      const [{ refreshToken }] = await loginUserWithDifferentUserAgent(
        5,
        app,
        userDto.create[0],
      );

      await request(app)
        .delete(FULL_PATH.DEVICES)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NO_CONTENT);

      const { body } = await request(app)
        .get(FULL_PATH.DEVICES)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.OK);

      expect(body.length).toBe(1);
    });
  });

  describe(`DELETE ${FULL_PATH.DEVICE}`, () => {
    it('should return 401 if no refresh token', async () => {
      await request(app)
        .delete(`${FULL_PATH.DEVICES}/123`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refreshToken is wrong', async () => {
      await request(app)
        .delete(`${FULL_PATH.DEVICES}/123`)
        .set('Cookie', 'refreshToken=refreshToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 if no such id', async () => {
      const { refreshToken } = await createUserAndLogin(app);

      await request(app)
        .delete(`${FULL_PATH.DEVICES}/${crypto.randomUUID()}`)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 if try to delete the deviceId of other user', async () => {
      await createUser(app, userDto.create[0]);
      await createUser(app, userDto.create[1]);
      const [user1Tokens] = await loginUserWithDifferentUserAgent(
        2,
        app,
        userDto.create[0],
      );
      const [user2Tokens] = await loginUserWithDifferentUserAgent(
        2,
        app,
        userDto.create[1],
      );
      const user1DeviceId1 = new JwtService().decode(
        user1Tokens.refreshToken,
      )?.deviceId;
      const user2DeviceId1 = new JwtService().decode(
        user2Tokens.refreshToken,
      )?.deviceId;

      await request(app)
        .delete(`${FULL_PATH.DEVICES}/${user2DeviceId1}`)
        .set('Cookie', `refreshToken=${user1Tokens.refreshToken}`)
        .expect(HttpStatus.FORBIDDEN);
      await request(app)
        .delete(`${FULL_PATH.DEVICES}/${user1DeviceId1}`)
        .set('Cookie', `refreshToken=${user2Tokens.refreshToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('unless should return 204', async () => {
      await createUser(app, userDto.create[0]);
      const [{ refreshToken }, userTokens2] =
        await loginUserWithDifferentUserAgent(2, app, userDto.create[0]);
      // @ts-ignore
      const user1DeviceId1 = new JwtService().decode(
        userTokens2.refreshToken,
      )?.deviceId;

      await request(app)
        .delete(`${FULL_PATH.DEVICES}/${user1DeviceId1}`)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
