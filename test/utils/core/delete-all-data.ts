import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { FULL_PATH } from '../../../src/core/constants/paths';

export function deleteAllData(app: App) {
  return request(app)
    .delete(FULL_PATH.TESTING_ALL)
    .expect(HttpStatus.NO_CONTENT);
}
