import request from 'supertest';
import { validAuth } from '../constants/common';
import { createBlogAndHisPost, postDto } from '../utils/post/post.util';
import { createBlog } from '../utils/blog/blog.util';
import { createUserAndLogin } from '../utils/user/user.util';
import { commentDto } from '../utils/comment/comment.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { FULL_PATH } from '../../src/core/constants/paths';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';

describe('Posts API body validation', () => {
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

  describe(`POST ${FULL_PATH.POSTS}`, () => {
    it.each`
      field                 | value               | message
      ${'title'}            | ${null}             | ${'title must be a string'}
      ${'title'}            | ${5}                | ${'title must be a string'}
      ${'title'}            | ${''}               | ${'title must be longer than or equal to 1 characters'}
      ${'title'}            | ${'    '}           | ${'title must be longer than or equal to 1 characters'}
      ${'title'}            | ${'4'.repeat(31)}   | ${'title must be shorter than or equal to 30 characters'}
      ${'shortDescription'} | ${null}             | ${'shortDescription must be a string'}
      ${'shortDescription'} | ${5}                | ${'shortDescription must be a string'}
      ${'shortDescription'} | ${''}               | ${'shortDescription must be longer than or equal to 1 characters'}
      ${'shortDescription'} | ${'    '}           | ${'shortDescription must be longer than or equal to 1 characters'}
      ${'shortDescription'} | ${'4'.repeat(101)}  | ${'shortDescription must be shorter than or equal to 100 characters'}
      ${'content'}          | ${null}             | ${'content must be a string'}
      ${'content'}          | ${5}                | ${'content must be a string'}
      ${'content'}          | ${''}               | ${'content must be longer than or equal to 1 characters'}
      ${'content'}          | ${'    '}           | ${'content must be longer than or equal to 1 characters'}
      ${'content'}          | ${'4'.repeat(1001)} | ${'content must be shorter than or equal to 1000 characters'}
      ${'blogId'}           | ${null}             | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${5}                | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${''}               | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${'    '}           | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${'dsfr'}           | ${'blogId must be a mongodb id'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const blog = await createBlog(app);
        const response = await request(app)
          .post(FULL_PATH.POSTS)
          .set('Authorization', validAuth)
          .send({ ...postDto.create, blogId: blog.id, [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`PUT ${FULL_PATH.POST}`, () => {
    it.each`
      field                 | value               | message
      ${'title'}            | ${5}                | ${'title must be a string'}
      ${'title'}            | ${''}               | ${'title must be longer than or equal to 1 characters'}
      ${'title'}            | ${'    '}           | ${'title must be longer than or equal to 1 characters'}
      ${'title'}            | ${'4'.repeat(31)}   | ${'title must be shorter than or equal to 30 characters'}
      ${'shortDescription'} | ${5}                | ${'shortDescription must be a string'}
      ${'shortDescription'} | ${''}               | ${'shortDescription must be longer than or equal to 1 characters'}
      ${'shortDescription'} | ${'    '}           | ${'shortDescription must be longer than or equal to 1 characters'}
      ${'shortDescription'} | ${'4'.repeat(101)}  | ${'shortDescription must be shorter than or equal to 100 characters'}
      ${'content'}          | ${5}                | ${'content must be a string'}
      ${'content'}          | ${''}               | ${'content must be longer than or equal to 1 characters'}
      ${'content'}          | ${'    '}           | ${'content must be longer than or equal to 1 characters'}
      ${'content'}          | ${'4'.repeat(1001)} | ${'content must be shorter than or equal to 1000 characters'}
      ${'blogId'}           | ${5}                | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${''}               | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${'    '}           | ${'blogId must be a mongodb id'}
      ${'blogId'}           | ${'dsfr'}           | ${'blogId must be a mongodb id'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const [blog, post] = await createBlogAndHisPost(app);

        const response = await request(app)
          .put(`${FULL_PATH.POSTS}/${post.id}`)
          .set('Authorization', validAuth)
          .send({ ...postDto.update, blogId: blog.id, [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`PUT ${FULL_PATH.POSTS}/:id/like-status`, () => {
    it.each`
      field           | value        | message
      ${'likeStatus'} | ${null}      | ${'likeStatus must be one of the following values: None, Like, Dislike'}
      ${'likeStatus'} | ${5}         | ${'likeStatus must be one of the following values: None, Like, Dislike'}
      ${'likeStatus'} | ${''}        | ${'likeStatus must be one of the following values: None, Like, Dislike'}
      ${'likeStatus'} | ${'    '}    | ${'likeStatus must be one of the following values: None, Like, Dislike'}
      ${'likeStatus'} | ${'unknown'} | ${'likeStatus must be one of the following values: None, Like, Dislike'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const [, post] = await createBlogAndHisPost(app);
        const { token } = await createUserAndLogin(app);

        const response = await request(app)
          .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`POST ${FULL_PATH.POSTS}/:id/comments`, () => {
    it.each`
      field        | value              | message
      ${'content'} | ${null}            | ${'content must be a string'}
      ${'content'} | ${5}               | ${'content must be a string'}
      ${'content'} | ${''}              | ${'content must be longer than or equal to 20 characters'}
      ${'content'} | ${'    '}          | ${'content must be longer than or equal to 20 characters'}
      ${'content'} | ${'4'.repeat(19)}  | ${'content must be longer than or equal to 20 characters'}
      ${'content'} | ${'l'.repeat(301)} | ${'content must be shorter than or equal to 300 characters'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const { token } = await createUserAndLogin(app);
        const [, post] = await createBlogAndHisPost(app);
        const response = await request(app)
          .post(`${FULL_PATH.POSTS}/${post.id}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ ...commentDto.create, [field]: value })
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
