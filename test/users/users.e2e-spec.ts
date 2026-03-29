import request from 'supertest';
import { App } from 'supertest/types';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { invalidAuth, validAuth, validMongoId } from '../constants/common';
import { createUser, createUsers, userDto } from '../utils/user/user.util';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('UsersController (e2e)', () => {
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

  it.each`
    path                       | method
    ${FULL_PATH.USERS}         | ${'get'}
    ${FULL_PATH.USERS}         | ${'post'}
    ${FULL_PATH.USERS + '/12'} | ${'delete'}
  `(
    'should return 401 when invalid header Authorization: [$method] $path',
    async ({
      path,
      method,
    }: {
      path: string;
      method: 'post' | 'get' | 'delete';
    }) => {
      await request(app)[method](path).expect(HttpStatus.UNAUTHORIZED);
      await request(app)
        [method](path)
        .set('Authorization', invalidAuth)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`POST ${FULL_PATH.USERS}`, () => {
    it('should create', async () => {
      const user = await createUser(app, userDto.create[0]);

      expect(user).toMatchObject({
        id: expect.any(String),
        login: userDto.create[0].login,
        email: userDto.create[0].email,
        createdAt: expect.any(String),
      });
    });

    it.each`
      field
      ${'login'}
      ${'email'}
    `('should throw 400 for the same $field', async ({ field }) => {
      await createUser(app, userDto.create[0]);

      const response = await request(app)
        .post(FULL_PATH.USERS)
        .set('Authorization', validAuth)
        .send({
          ...userDto.create[1],
          // @ts-ignore
          [field]: userDto.create[0][field],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(
        response.body.errorsMessages.find(
          (error: { field: string }) => error.field === field,
        ),
      ).toBeTruthy();
      expect(response.body.errorsMessages.length).toBe(1);
    });
  });

  describe(`GET ${FULL_PATH.USERS}`, () => {
    it('should return items: [] when no users', async () => {
      const response = await request(app)
        .get(FULL_PATH.USERS)
        .set('Authorization', validAuth)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
      });
    });

    describe('test query params', () => {
      beforeEach(async () => {
        await createUsers(2, app);
      });

      describe('pagination', () => {
        it('default', async () => {
          const response = await request(app)
            .get(FULL_PATH.USERS)
            .set('Authorization', validAuth)
            .expect(HttpStatus.OK);

          expect(response.body).toMatchObject({
            page: 1,
            pageSize: 10,
            pagesCount: 1,
            totalCount: 2,
          });
        });

        it('pageSize', async () => {
          const response = await request(app)
            .get(`${FULL_PATH.USERS}?pageSize=1`)
            .set('Authorization', validAuth)
            .expect(HttpStatus.OK);

          expect(response.body).toMatchObject({
            page: 1,
            pageSize: 1,
            pagesCount: 2,
            totalCount: 2,
          });
        });

        it('pageSize = 99', async () => {
          const response = await request(app)
            .get(`${FULL_PATH.USERS}?pageSize=99`)
            .set('Authorization', validAuth)
            .expect(HttpStatus.OK);

          expect(response.body).toMatchObject({
            page: 1,
            pageSize: 99,
            pagesCount: 1,
            totalCount: 2,
          });
        });
      });

      it('pageSize=15&pageNumber=1&searchLoginTerm=seR&searchEmailTerm=.com&sortDirection=asc&sortBy=login', async () => {
        await Promise.all(
          [
            {
              password: '719c3d7103f94086fb6',
              login: 'user01',
              email: 'email1p@gg.cm',
            },
            {
              password: '719c3d7103f94086fbb',
              login: 'user02',
              email: 'email1p@gg.com',
            },
            {
              password: '71ac3d7103f94086fc0',
              login: 'user05',
              email: 'email1p@gg.coi',
            },
            {
              password: '71ac3d7103f94086fc5',
              login: 'user03',
              email: 'email1p@gg.cou',
            },
            {
              password: '71ac3d7103f94086fca',
              login: 'useee01',
              email: 'email1p@gg.col',
            },
            {
              password: '71ac3d7103f94086fcf',
              login: 'log01',
              email: 'emai@gg.com',
            },
            {
              password: '71bc3d7103f94086fd4',
              login: 'log02',
              email: 'email2p@g.com',
            },
            {
              password: '71bc3d7103f94086fd9',
              login: 'loSer',
              email: 'email2p@gg.om',
            },
            {
              password: '71bc3d7103f94086fde',
              login: 'uer15',
              email: 'emarrr1@gg.com',
            },
            {
              password: '71bc3d7103f94086fe3',
              login: 'usr-1-01',
              email: 'email3@gg.com',
            },
            {
              password: '71cc3d7103f94086fe8',
              login: 'some01',
              email: 'email1@gyyyg.ru',
            },
            {
              password: '71cc3d7103f94086fed',
              login: 'use4406',
              email: 'email1@grrg.ro',
            },
          ].map(async (dto) => await createUser(app, dto)),
        );

        const response = await request(app)
          .get(
            `${FULL_PATH.USERS}?pageSize=15&pageNumber=1&searchLoginTerm=seR&searchEmailTerm=.com&sortDirection=asc&sortBy=login`,
          )
          .set('Authorization', validAuth)
          .expect(HttpStatus.OK);

        expect(response.body.totalCount).toBe(11);
      });
    });
  });

  describe(`DELETE ${FULL_PATH.USER}`, () => {
    it('should return 400 when invalid id', async () => {
      await request(app)
        .delete(`${FULL_PATH.USERS}/someinvalidid`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 when no user', async () => {
      await request(app)
        .delete(`${FULL_PATH.USERS}/${validMongoId}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, user2] = await createUsers(2, app);

      await request(app)
        .delete(`${FULL_PATH.USERS}/${user2.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
