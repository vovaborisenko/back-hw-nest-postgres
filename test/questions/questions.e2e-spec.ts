import request from 'supertest';
import { invalidAuth, validAuth, validParamId } from '../constants/common';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';
import {
  createQuestion,
  createQuestions,
  questionDto,
} from '../utils/question/question.util';

function getPath(pathTemplate: string, id: number | string) {
  return pathTemplate.replace(':id', id.toString());
}

describe('QuestionController (e2e)', () => {
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
    pathTemplate                     | method
    ${FULL_PATH.SA_QUESTIONS}        | ${'get'}
    ${FULL_PATH.SA_QUESTIONS}        | ${'post'}
    ${FULL_PATH.SA_QUESTION}         | ${'put'}
    ${FULL_PATH.SA_QUESTION}         | ${'delete'}
    ${FULL_PATH.SA_QUESTION_PUBLISH} | ${'put'}
  `(
    'should return 401 when invalid header Authorization: [$method] $pathTemplate',
    async ({
      pathTemplate,
      method,
    }: {
      pathTemplate: string;
      method: 'get' | 'post' | 'put' | 'delete';
    }) => {
      const path = getPath(pathTemplate, 12);
      await request(app)[method](path).expect(HttpStatus.UNAUTHORIZED);
      await request(app)
        [method](path)
        .set('Authorization', invalidAuth)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`POST ${FULL_PATH.SA_QUESTIONS}`, () => {
    it('should create question', async () => {
      const question = await createQuestion(app, questionDto[1]);

      expect(question).toEqual({
        ...questionDto[1],
        id: expect.any(String),
        published: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe.each`
    path
    ${FULL_PATH.SA_QUESTIONS}
  `(`GET $path`, ({ path }) => {
    it('should return [] when no questions', async () => {
      const response = await request(app)
        .get(path)
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

    it('should return list of questions', async () => {
      const [question1, question2] = await createQuestions(2, app);
      const response = await request(app)
        .get(path)
        .set('Authorization', validAuth)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [question2, question1],
        page: 1,
        pageSize: 10,
        pagesCount: 1,
        totalCount: 2,
      });
    });
  });

  describe(`PUT ${FULL_PATH.SA_QUESTION}`, () => {
    it('should return 404 when no question', async () => {
      await request(app)
        .put(getPath(FULL_PATH.SA_QUESTION, validParamId))
        .set('Authorization', validAuth)
        .send(questionDto[2])
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [question1, question2] = await createQuestions(2, app);

      await request(app)
        .put(getPath(FULL_PATH.SA_QUESTION, question1.id))
        .set('Authorization', validAuth)
        .send(questionDto[2])
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .put(getPath(FULL_PATH.SA_QUESTION, question2.id))
        .set('Authorization', validAuth)
        .send(questionDto[3])
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(FULL_PATH.SA_QUESTIONS)
        .set('Authorization', validAuth)
        .expect(HttpStatus.OK);

      expect(response.body.items[0]).toMatchObject(questionDto[3]);
    });
  });

  describe(`DELETE ${FULL_PATH.SA_QUESTION}`, () => {
    it('should return 404 when no question', async () => {
      await request(app)
        .delete(getPath(FULL_PATH.SA_QUESTION, validParamId))
        .set('Authorization', validAuth)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, question2] = await createQuestions(2, app);

      await request(app)
        .delete(getPath(FULL_PATH.SA_QUESTION, question2.id))
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe(`PUT ${FULL_PATH.SA_QUESTION_PUBLISH}`, () => {
    it('should return 404 when no question', async () => {
      await request(app)
        .put(getPath(FULL_PATH.SA_QUESTION_PUBLISH, validParamId))
        .set('Authorization', validAuth)
        .send({ published: true })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, question2] = await createQuestions(2, app);

      expect(question2).toMatchObject({ published: false });

      await request(app)
        .put(getPath(FULL_PATH.SA_QUESTION_PUBLISH, question2.id))
        .set('Authorization', validAuth)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(FULL_PATH.SA_QUESTIONS)
        .set('Authorization', validAuth)
        .expect(HttpStatus.OK);

      expect(response.body.items[0]).toMatchObject({ published: true });
    });
  });
});
