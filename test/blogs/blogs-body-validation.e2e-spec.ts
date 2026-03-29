import request from 'supertest';
import { validAuth } from '../constants/common';
import { blogDto, createBlog } from '../utils/blog/blog.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('Blogs API body validation', () => {
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

  describe(`POST ${FULL_PATH.BLOGS}`, () => {
    it.each`
      field            | value              | message
      ${'name'}        | ${null}            | ${'name must be a string'}
      ${'name'}        | ${5}               | ${'name must be a string'}
      ${'name'}        | ${''}              | ${'name must be longer than or equal to 1 characters'}
      ${'name'}        | ${'    '}          | ${'name must be longer than or equal to 1 characters'}
      ${'name'}        | ${'4'.repeat(16)}  | ${'name must be shorter than or equal to 15 characters'}
      ${'description'} | ${null}            | ${'description must be a string'}
      ${'description'} | ${5}               | ${'description must be a string'}
      ${'description'} | ${''}              | ${'description must be longer than or equal to 1 characters'}
      ${'description'} | ${'    '}          | ${'description must be longer than or equal to 1 characters'}
      ${'description'} | ${'4'.repeat(501)} | ${'description must be shorter than or equal to 500 characters'}
      ${'websiteUrl'}  | ${null}            | ${'websiteUrl must be a string'}
      ${'websiteUrl'}  | ${5}               | ${'websiteUrl must be a string'}
      ${'websiteUrl'}  | ${''}              | ${'websiteUrl must be longer than or equal to 1 characters'}
      ${'websiteUrl'}  | ${'    '}          | ${'websiteUrl must be longer than or equal to 1 characters'}
      ${'websiteUrl'}  | ${'4'.repeat(101)} | ${'websiteUrl must be shorter than or equal to 100 characters'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(FULL_PATH.BLOGS)
          .set('Authorization', validAuth)
          .send({ ...blogDto.create, [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`PUT ${FULL_PATH.BLOGS}/:id`, () => {
    it.each`
      field            | value              | message
      ${'name'}        | ${5}               | ${'name must be a string'}
      ${'name'}        | ${''}              | ${'name must be longer than or equal to 1 characters'}
      ${'name'}        | ${'    '}          | ${'name must be longer than or equal to 1 characters'}
      ${'name'}        | ${'4'.repeat(16)}  | ${'name must be shorter than or equal to 15 characters'}
      ${'description'} | ${5}               | ${'description must be a string'}
      ${'description'} | ${''}              | ${'description must be longer than or equal to 1 characters'}
      ${'description'} | ${'    '}          | ${'description must be longer than or equal to 1 characters'}
      ${'description'} | ${'4'.repeat(501)} | ${'description must be shorter than or equal to 500 characters'}
      ${'websiteUrl'}  | ${5}               | ${'websiteUrl must be a string'}
      ${'websiteUrl'}  | ${''}              | ${'websiteUrl must be longer than or equal to 1 characters'}
      ${'websiteUrl'}  | ${'    '}          | ${'websiteUrl must be longer than or equal to 1 characters'}
      ${'websiteUrl'}  | ${'4'.repeat(101)} | ${'websiteUrl must be shorter than or equal to 100 characters'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const blog = await createBlog(app);

        const response = await request(app)
          .put(`${FULL_PATH.BLOGS}/${blog.id}`)
          .set('Authorization', validAuth)
          .send({ ...blogDto.update, [field]: value })
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
