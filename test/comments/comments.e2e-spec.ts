import request from 'supertest';
import { invalidAuth, validMongoId } from '../constants/common';
import {
  commentDto,
  createComment,
  createComments,
} from '../utils/comment/comment.util';
import { createUserAndLogin, userDto } from '../utils/user/user.util';
import { LikeStatus } from '../../src/modules/bloggers-platform/likes/enums/like-status';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('CommentsController (e2e)', () => {
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
    path                                      | method
    ${FULL_PATH.COMMENTS + '/12'}             | ${'put'}
    ${FULL_PATH.COMMENTS + '/12/like-status'} | ${'put'}
    ${FULL_PATH.COMMENTS + '/12'}             | ${'delete'}
  `(
    'should return 401 when invalid header Authorization: [$method] $path',
    async ({ path, method }: { path: string; method: 'put' | 'delete' }) => {
      await request(app)[method](path).expect(HttpStatus.UNAUTHORIZED);
      await request(app)
        [method](path)
        .set('Authorization', `Bearer ${invalidAuth}`)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`GET ${FULL_PATH.COMMENTS}/:id`, () => {
    it('should return 404 when no comment', async () => {
      await request(app)
        .get(`${FULL_PATH.COMMENTS}/${validMongoId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return comment with requested id', async () => {
      const [comment] = await createComment(app);

      const response = await request(app)
        .get(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(comment);
    });
  });

  describe(`PUT ${FULL_PATH.COMMENTS}/:id`, () => {
    it('should return 404 when no comment', async () => {
      const { token } = await createUserAndLogin(app);
      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${validMongoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.update)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when user is not owner of comment', async () => {
      const [comment] = await createComment(app);
      const { token } = await createUserAndLogin(app, userDto.create[1]);
      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.update)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 204 when requested id exist', async () => {
      const [comment, , token] = await createComment(app);

      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.update)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ ...comment, ...commentDto.update });
    });
  });

  describe(`PUT ${FULL_PATH.COMMENTS}/:id/like-status`, () => {
    it('should return 404 when no comment', async () => {
      const { token } = await createUserAndLogin(app);
      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${validMongoId}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[0])
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [comment, , token] = await createComment(app);

      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${comment.id}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[0])
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...comment,
        likesInfo: {
          ...comment.likesInfo,
          likesCount: comment.likesInfo.likesCount + 1,
          myStatus: LikeStatus.Like,
        },
      });

      await request(app)
        .put(`${FULL_PATH.COMMENTS}/${comment.id}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[1])
        .expect(HttpStatus.NO_CONTENT);

      const responseAfterDislike = await request(app)
        .get(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(responseAfterDislike.body).toEqual({
        ...comment,
        likesInfo: {
          ...comment.likesInfo,
          dislikesCount: comment.likesInfo.dislikesCount + 1,
          myStatus: LikeStatus.Dislike,
        },
      });
    });

    it('should update likes', async () => {
      const [comments, , token] = await createComments(4, app);

      // set likes
      for (let i = 0; i < comments.length; i++) {
        await request(app)
          .put(`${FULL_PATH.COMMENTS}/${comments[i].id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[0])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        expect(response.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          likesCount: 1,
          myStatus: LikeStatus.Like,
        });

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          likesCount: 1,
          myStatus: LikeStatus.None,
        });
      }
      // set dislikes
      for (let i = 0; i < comments.length; i++) {
        await request(app)
          .put(`${FULL_PATH.COMMENTS}/${comments[i].id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[1])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        expect(response.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          dislikesCount: 1,
          myStatus: LikeStatus.Dislike,
        });

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          dislikesCount: 1,
          myStatus: LikeStatus.None,
        });
      }
      // set none
      for (let i = 3; i < comments.length; i++) {
        await request(app)
          .put(`${FULL_PATH.COMMENTS}/${comments[i].id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[2])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        expect(response.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          myStatus: LikeStatus.None,
        });

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.COMMENTS}/${comments[i].id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.likesInfo).toEqual({
          ...comments[i].likesInfo,
          myStatus: LikeStatus.None,
        });
      }
    });
  });

  describe(`DELETE ${FULL_PATH.COMMENTS}/:id`, () => {
    it('should return 404 when no comment', async () => {
      const { token } = await createUserAndLogin(app);
      await request(app)
        .delete(`${FULL_PATH.COMMENTS}/${validMongoId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when user is not owner of comment', async () => {
      const [comment] = await createComment(app);
      const { token } = await createUserAndLogin(app, userDto.create[1]);
      await request(app)
        .delete(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 204 when requested id exist', async () => {
      const [comment, , token] = await createComment(app);

      await request(app)
        .delete(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .get(`${FULL_PATH.COMMENTS}/${comment.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
