import type { App } from 'supertest/types';
import request from 'supertest';
import { validAuth } from '../../constants/common';
import { HttpStatus } from '@nestjs/common';
import { FULL_PATH } from '../../../src/core/constants/paths';
import { CreateQuestionDto } from '../../../src/modules/quiz/question/dto/create-question.dto';
import { UpdateQuestionDto } from '../../../src/modules/quiz/question/dto/update-question.dto';
import { QuestionViewDto } from '../../../src/modules/quiz/question/api/view-dto/question.view-dto';
import { CreateQuestionInputDto } from '../../../src/modules/quiz/question/api/input-dto/create-question.input-dto';

export const questionDto: (CreateQuestionDto | UpdateQuestionDto)[] = [
  {
    body: 'What is TypeScript?',
    correctAnswers: [
      'Static typing',
      'JavaScript superset',
      'Programming language',
    ],
  },
  {
    body: 'What does SQL stand for?',
    correctAnswers: ['Structured Query Language'],
  },
  {
    body: 'Explain the difference between let and const in JavaScript.',
    correctAnswers: [
      'let allows reassignment, const does not',
      'const must be initialized during declaration',
    ],
  },
  {
    body: 'What is the capital of France?',
    correctAnswers: ['Paris', 'paris', 'PARIS'],
  },
  {
    body: 'Name three JavaScript frameworks.',
    correctAnswers: ['React', 'Angular', 'Vue.js'],
  },
];

export async function createQuestion(
  app: App,
  dto: CreateQuestionInputDto = questionDto[0],
): Promise<QuestionViewDto> {
  const { body: question } = await request(app)
    .post(FULL_PATH.SA_QUESTIONS)
    .set('Authorization', validAuth)
    .send({ ...dto })
    .expect(HttpStatus.CREATED);

  return question;
}

export async function publishQuestion(
  app: App,
  questionId: string,
): Promise<void> {
  await request(app)
    .put(FULL_PATH.SA_QUESTION_PUBLISH.replace(':id', questionId))
    .set('Authorization', validAuth)
    .send({ published: true })
    .expect(HttpStatus.NO_CONTENT);
}

export async function createQuestions(
  count: number,
  app: App,
  dto: CreateQuestionInputDto = questionDto[0],
): Promise<QuestionViewDto[]> {
  const requests = Array.from({ length: count }).map((_, index) =>
    createQuestion(app, {
      body: `${dto.body}${index}`,
      correctAnswers: [`${index}`, ...dto.correctAnswers],
    }),
  );

  return Promise.all(requests);
}

export async function createAndPublishQuestions(
  count: number,
  app: App,
  dto: CreateQuestionInputDto = questionDto[0],
): Promise<Record<string, QuestionViewDto>> {
  const results: Record<string, QuestionViewDto> = {};

  for (let index = 0; index < count; index++) {
    const question = await createQuestion(app, {
      body: `${dto.body}${index}`,
      correctAnswers: [`${index}`, ...dto.correctAnswers],
    });

    await publishQuestion(app, question.id);

    results[question.id] = question;
  }

  return results;
}
