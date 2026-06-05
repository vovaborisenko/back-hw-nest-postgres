import request from 'supertest';
import { validAuth } from '../constants/common';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';
import { createQuestion, questionDto } from '../utils/question/question.util';

describe('Questions API body validation', () => {
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

  describe(`POST ${FULL_PATH.SA_QUESTIONS}`, () => {
    it.each`
      field               | value              | message
      ${'body'}           | ${5}               | ${'body must be a string'}
      ${'body'}           | ${''}              | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'    '}          | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'s'.repeat(9)}   | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'4'.repeat(501)} | ${'body must be shorter than or equal to 500 characters'}
      ${'correctAnswers'} | ${null}            | ${'each value in correctAnswers must be a string'}
      ${'correctAnswers'} | ${5}               | ${'each value in correctAnswers must be a string'}
      ${'correctAnswers'} | ${''}              | ${'correctAnswers must be an array'}
      ${'correctAnswers'} | ${'    '}          | ${'correctAnswers must be an array'}
      ${'correctAnswers'} | ${['4', null]}     | ${'each value in correctAnswers must be a string'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const response = await request(app)
          .post(FULL_PATH.SA_QUESTIONS)
          .set('Authorization', validAuth)
          .send({ ...questionDto[0], [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`PUT ${FULL_PATH.SA_QUESTION}`, () => {
    it.each`
      field               | value              | message
      ${'body'}           | ${5}               | ${'body must be a string'}
      ${'body'}           | ${''}              | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'    '}          | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'s'.repeat(9)}   | ${'body must be longer than or equal to 10 characters'}
      ${'body'}           | ${'4'.repeat(501)} | ${'body must be shorter than or equal to 500 characters'}
      ${'correctAnswers'} | ${null}            | ${'each value in correctAnswers must be a string'}
      ${'correctAnswers'} | ${5}               | ${'each value in correctAnswers must be a string'}
      ${'correctAnswers'} | ${''}              | ${'correctAnswers must be an array'}
      ${'correctAnswers'} | ${'    '}          | ${'correctAnswers must be an array'}
      ${'correctAnswers'} | ${['4', null]}     | ${'each value in correctAnswers must be a string'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const question = await createQuestion(app);

        const response = await request(app)
          .put(`${FULL_PATH.SA_QUESTION.replace(':id', question.id)}`)
          .set('Authorization', validAuth)
          .send({ ...questionDto[2], [field]: value })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errorsMessages.find(
            (error: { field: string }) => error.field === field,
          )?.message,
        ).toBe(message);
      },
    );
  });

  describe(`PUT ${FULL_PATH.SA_QUESTION_PUBLISH}`, () => {
    it.each`
      field          | value     | message
      ${'published'} | ${5}      | ${'published must be a boolean value'}
      ${'published'} | ${''}     | ${'published must be a boolean value'}
      ${'published'} | ${'    '} | ${'published must be a boolean value'}
      ${'published'} | ${[]}     | ${'published must be a boolean value'}
      ${'published'} | ${null}   | ${'published must be a boolean value'}
    `(
      'should throw 400: field = $field, value = $value, message = $message',
      async ({ field, value, message }) => {
        const question = await createQuestion(app);

        const response = await request(app)
          .put(`${FULL_PATH.SA_QUESTION_PUBLISH.replace(':id', question.id)}`)
          .set('Authorization', validAuth)
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
});
