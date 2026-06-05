import request from 'supertest';
import { invalidAuth } from '../constants/common';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';
import { createAndPublishQuestions } from '../utils/question/question.util';
import { createUsersAndLogin } from '../utils/user/user.util';
import { GameStatus } from '../../src/modules/quiz/game/enum/game-status';
import { QuestionViewDto } from '../../src/modules/quiz/question/api/view-dto/question.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { GameViewDto } from '../../src/modules/quiz/game/api/view-dto/game.view-dto';
import { AnswerStatus } from '../../src/modules/quiz/player-progress/enum/answer-status';
import { wait } from '../utils/core/wait';

function getPath(pathTemplate: string, id: number | string) {
  return pathTemplate.replace(':id', id.toString());
}

describe('GameController (e2e)', () => {
  let nestApp: INestApplication<App>;
  let app: App;
  let storage;
  let questions: Record<string, QuestionViewDto> = {};
  let users: { user: UserViewDto; token: string; refreshToken: string }[] = [];

  beforeAll(async () => {
    const result = await initTestApp();

    nestApp = result.nestApp;
    app = result.httpServer;
    storage = result.throttlerStorage;

    await deleteAllData(app);
    users = await createUsersAndLogin(5, app);
    questions = await createAndPublishQuestions(20, app);
  });

  afterAll(async () => {
    await nestApp!.close();
  });

  beforeEach(async () => {
    await storage._storage.clear();
  });

  it.each`
    pathTemplate                 | method
    ${FULL_PATH.GAME}            | ${'get'}
    ${FULL_PATH.GAME_CURRENT}    | ${'get'}
    ${FULL_PATH.GAME_NEW}        | ${'post'}
    ${FULL_PATH.GAME_ADD_ANSWER} | ${'post'}
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
        .set('Authorization', `Bearer ${invalidAuth}`)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`POST ${FULL_PATH.GAME_NEW}`, () => {
    it('should create game', async () => {
      const [{ user, token }] = users;

      const { body } = await request(app)
        .post(FULL_PATH.GAME_NEW)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          score: 0,
          answers: [],
          player: {
            id: user.id,
            login: user.login,
          },
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatus.Pending,
        pairCreatedDate: expect.any(String),
        startGameDate: null,
        finishGameDate: null,
      });
    });

    it('the same user can`t add to pending game', async () => {
      const [{ token }] = users;

      await request(app)
        .post(FULL_PATH.GAME_NEW)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should activate game', async () => {
      const [{ token }, { user: user2, token: token2 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      const { body } = await request(app)
        .post(FULL_PATH.GAME_NEW)
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.OK);

      expect(body.questions.length).toEqual(5);
      expect(body).toEqual({
        ...game,
        secondPlayerProgress: {
          score: 0,
          answers: [],
          player: {
            id: user2.id,
            login: user2.login,
          },
        },
        questions: expect.any(Array),
        status: GameStatus.Active,
        startGameDate: expect.any(String),
      });
    });

    it.each`
      userIndex
      ${0}
      ${1}
    `('the same users can`t add to active game', async ({ userIndex }) => {
      const { token } = users[userIndex];
      await request(app)
        .post(FULL_PATH.GAME_NEW)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should create game by the other user', async () => {
      const [{ token }, , { user: user3, token: token3 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      const { body } = await request(app)
        .post(FULL_PATH.GAME_NEW)
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);

      expect(game.id).not.toBe(body.id);
      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          score: 0,
          answers: [],
          player: {
            id: user3.id,
            login: user3.login,
          },
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatus.Pending,
        pairCreatedDate: expect.any(String),
        startGameDate: null,
        finishGameDate: null,
      });
    });
  });

  describe(`GET ${FULL_PATH.GAME_CURRENT}`, () => {
    it('the same game for first and second players', async () => {
      const [{ token }, { token: token2 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
      const { body: game2 } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.OK);

      expect(game).toEqual(game2);
    });
  });

  describe(`GET ${FULL_PATH.GAME}`, () => {
    it('game is forbidden for other players', async () => {
      const [{ token }, { token: token2 }, { token: token3 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
      const { body: game3 } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);

      await request(app)
        .get(getPath(FULL_PATH.GAME, game3.id))
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);

      await request(app)
        .get(getPath(FULL_PATH.GAME, game3.id))
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.FORBIDDEN);

      await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return game', async () => {
      const [{ token }, { token: token2 }, { token: token3 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
      const { body: game3 } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);

      const result = await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(result.body).toEqual(game);

      const result2 = await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.OK);

      expect(result2.body).toEqual(game);

      const result3 = await request(app)
        .get(getPath(FULL_PATH.GAME, game3.id))
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);

      expect(result3.body).toEqual(game3);
    });
  });

  describe(`POST ${FULL_PATH.GAME_ADD_ANSWER}`, () => {
    let game: GameViewDto;

    it('adding incorrect answer', async () => {
      const [{ token }] = users;
      const response = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      game = response.body;

      const { body } = await request(app)
        .post(FULL_PATH.GAME_ADD_ANSWER)
        .set('Authorization', `Bearer ${token}`)
        .send({ answer: 'incorrect' })
        .expect(HttpStatus.OK);

      expect(body).toEqual({
        questionId: game.questions?.[0].id,
        answerStatus: AnswerStatus.Incorrect,
        addedAt: expect.any(String),
      });
    });

    it('adding correct answer', async () => {
      const [, { token }] = users;
      const { body } = await request(app)
        .post(FULL_PATH.GAME_ADD_ANSWER)
        .set('Authorization', `Bearer ${token}`)
        .send({ answer: questions[game.questions![0].id].correctAnswers[0] })
        .expect(HttpStatus.OK);

      expect(body).toEqual({
        questionId: game.questions?.[0].id,
        answerStatus: AnswerStatus.Correct,
        addedAt: expect.any(String),
      });
    });

    it('check score', async () => {
      const [, { token }] = users;

      await wait(1e3);

      const result = await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(result.body.firstPlayerProgress.score).toBe(0);
      expect(result.body.secondPlayerProgress.score).toBe(1);
    });

    it('game in process', async () => {
      const [{ token }, { token: token2 }] = users;

      for (let i = 1; i < game.questions!.length - 1; i++) {
        const resonseAnswer = await request(app)
          .post(FULL_PATH.GAME_ADD_ANSWER)
          .set('Authorization', `Bearer ${token}`)
          .send({ answer: questions[game.questions![i].id].correctAnswers[0] })
          .expect(HttpStatus.OK);
        expect(resonseAnswer.body.questionId).toBe(game.questions![i].id);
        await wait(1e3);

        const resonseAnswer2 = await request(app)
          .post(FULL_PATH.GAME_ADD_ANSWER)
          .set('Authorization', `Bearer ${token2}`)
          .send({ answer: questions[game.questions![i].id].correctAnswers[0] })
          .expect(HttpStatus.OK);
        expect(resonseAnswer2.body.questionId).toBe(game.questions![i].id);
        await wait(1e3);
      }

      const { body } = await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(body.firstPlayerProgress.score).toBe(3);
      expect(body.secondPlayerProgress.score).toBe(4);
      expect(body.firstPlayerProgress.answers.length).toBe(4);
      expect(body.secondPlayerProgress.answers.length).toBe(4);
      expect(body.finishGameDate).toBe(null);
      expect(body.status).toBe(GameStatus.Active);
    }, 1e4);

    it('finish game', async () => {
      const [{ token }, { token: token2 }] = users;

      await request(app)
        .post(FULL_PATH.GAME_ADD_ANSWER)
        .set('Authorization', `Bearer ${token}`)
        .send({ answer: 'first incorrect answer' })
        .expect(HttpStatus.OK);
      await wait(1e3);

      await request(app)
        .post(FULL_PATH.GAME_ADD_ANSWER)
        .set('Authorization', `Bearer ${token2}`)
        .send({ answer: 'second incorrect answer' })
        .expect(HttpStatus.OK);
      await wait(1e3);

      const { body } = await request(app)
        .get(getPath(FULL_PATH.GAME, game.id))
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(body.firstPlayerProgress.score).toBe(4);
      expect(body.secondPlayerProgress.score).toBe(4);
      expect(body.firstPlayerProgress.answers.length).toBe(5);
      expect(body.secondPlayerProgress.answers.length).toBe(5);
      expect(body.finishGameDate).toStrictEqual(expect.any(String));
      expect(body.status).toBe(GameStatus.Finished);
    });
  });

  describe(`GET ${FULL_PATH.GAME_CURRENT}`, () => {
    it('should return 404 for first and second players', async () => {
      const [{ token }, { token: token2 }] = users;

      const { body: game } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);
      const { body: game2 } = await request(app)
        .get(FULL_PATH.GAME_CURRENT)
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(game).toEqual(game2);
    });
  });
});
