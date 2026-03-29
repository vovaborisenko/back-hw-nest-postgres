import request from 'supertest';
import { invalidAuth, validAuth, validMongoId } from '../constants/common';
import {
  createBlogAndHisPost,
  createBlogAndHisPosts,
  createPost,
  postDto,
} from '../utils/post/post.util';
import { createBlog, createBlogs } from '../utils/blog/blog.util';
import {
  createUserAndLogin,
  createUsersAndLogin,
} from '../utils/user/user.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { FULL_PATH } from '../../src/core/constants/paths';
import {
  commentDto,
  createComment,
  createComments,
} from '../utils/comment/comment.util';
import { LikeStatus } from '../../src/modules/bloggers-platform/likes/enums/like-status';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';

describe('Posts API', () => {
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
    ${FULL_PATH.POSTS}         | ${'post'}
    ${FULL_PATH.POSTS + '/12'} | ${'put'}
    ${FULL_PATH.POSTS + '/12'} | ${'delete'}
  `(
    `should return 401 when invalid header Authorization: [$method] $path`,
    async ({
      path,
      method,
    }: {
      path: string;
      method: 'post' | 'put' | 'delete';
    }) => {
      await request(app)[method](path).expect(HttpStatus.UNAUTHORIZED);
      await request(app)
        [method](path)
        .set('Authorization', invalidAuth)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`POST ${FULL_PATH.POSTS}`, () => {
    it('should return 404 if not exist blog', async () => {
      await request(app)
        .post(FULL_PATH.POSTS)
        .set('Authorization', validAuth)
        .send({ ...postDto.create, blogId: validMongoId })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should create', async () => {
      const [blog, post] = await createBlogAndHisPost(app);

      expect(post).toEqual({
        ...postDto.create,
        blogId: blog.id,
        blogName: blog.name,
        id: expect.any(String),
        createdAt: expect.any(String),
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: 'None',
          // myStatus: LikeStatus.None,
          newestLikes: [],
        },
      });
    });
  });

  describe(`GET ${FULL_PATH.POSTS}`, () => {
    it('should return Paginated<[]> when no posts', async () => {
      const response = await request(app)
        .get(FULL_PATH.POSTS)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
      });
    });

    it('should return list of posts', async () => {
      await createBlogAndHisPosts(2, app);

      const response = await request(app)
        .get(FULL_PATH.POSTS)
        .expect(HttpStatus.OK);

      expect(response.body.items.length).toBe(2);
    });

    it('should return sorted by blogName list of posts', async () => {
      const blogs = await createBlogs(12, app);
      await Promise.all(
        blogs.map(({ id }) =>
          createPost(app, { ...postDto.create, blogId: id }),
        ),
      );

      const response = await request(app)
        .get(`${FULL_PATH.POSTS}?sortBy=blogName`)
        .expect(HttpStatus.OK);

      const blogNames = response.body.items.map(({ blogName }) => blogName);
      const expectedNames = blogNames.toSorted((a, b) => (a < b ? 1 : -1));

      expect(blogNames).toEqual(expectedNames);
    });
  });

  describe(`GET ${FULL_PATH.POSTS}/:id`, () => {
    it('should return 404 when no post', async () => {
      await request(app)
        .get(`${FULL_PATH.POSTS}/${validMongoId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return post with requested id', async () => {
      const [, posts] = await createBlogAndHisPosts(2, app);

      const response = await request(app)
        .get(`${FULL_PATH.POSTS}/${posts[1].id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(posts[1]);
    });
  });

  describe(`PUT ${FULL_PATH.POSTS}/:id`, () => {
    it('should return 404 when no post', async () => {
      const blog = await createBlog(app);
      await request(app)
        .put(`${FULL_PATH.POSTS}/${validMongoId}`)
        .set('Authorization', validAuth)
        .send({ ...postDto.update, blogId: blog.id })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 if not exist blog', async () => {
      const [, post] = await createBlogAndHisPost(app);

      await request(app)
        .put(`${FULL_PATH.POSTS}/${post.id}`)
        .set('Authorization', validAuth)
        .send({ ...postDto.create, blogId: validMongoId })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [blog, [post1, post2]] = await createBlogAndHisPosts(2, app);
      const editedPost = { ...postDto.update, blogId: blog.id };

      await request(app)
        .put(`${FULL_PATH.POSTS}/${post1.id}`)
        .set('Authorization', validAuth)
        .send({ ...editedPost, title: 'updated title' })
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .put(`${FULL_PATH.POSTS}/${post2.id}`)
        .set('Authorization', validAuth)
        .send(editedPost)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(`${FULL_PATH.POSTS}/${post2.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(editedPost);
    });
  });

  describe(`PUT ${FULL_PATH.POSTS}/:id/like-status`, () => {
    it('should return 404 when no post', async () => {
      const { token } = await createUserAndLogin(app);
      await request(app)
        .put(`${FULL_PATH.POSTS}/${validMongoId}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[0])
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, post] = await createBlogAndHisPost(app);
      const { token, user } = await createUserAndLogin(app);

      await request(app)
        .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[0])
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(`${FULL_PATH.POSTS}/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...post,
        extendedLikesInfo: {
          ...post.extendedLikesInfo,
          likesCount: post.extendedLikesInfo.likesCount + 1,
          myStatus: LikeStatus.Like,
          newestLikes: [
            {
              addedAt: expect.any(String),
              login: user.login,
              userId: user.id,
            },
          ],
        },
      });

      await request(app)
        .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.updateLikeStatus[1])
        .expect(HttpStatus.NO_CONTENT);

      const responseAfterDislike = await request(app)
        .get(`${FULL_PATH.POSTS}/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(responseAfterDislike.body).toEqual({
        ...post,
        extendedLikesInfo: {
          ...post.extendedLikesInfo,
          dislikesCount: post.extendedLikesInfo.dislikesCount + 1,
          myStatus: LikeStatus.Dislike,
        },
      });
    });

    it('should update likes', async () => {
      const [, post] = await createBlogAndHisPost(app);
      const createdUsers = await createUsersAndLogin(4, app);

      // set likes
      for (let i = 0; i < createdUsers.length; i++) {
        const { user, token } = createdUsers[i];
        await request(app)
          .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[0])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        // @ts-ignore todo
        post.extendedLikesInfo.newestLikes = [
          {
            addedAt: expect.any(String),
            login: user.login,
            userId: user.id,
          },
          ...post.extendedLikesInfo.newestLikes,
        ].slice(0, 3);
        post.extendedLikesInfo.likesCount += 1;
        const expectedLikeInfo = {
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.Like,
        };

        expect(response.body.extendedLikesInfo).toEqual(expectedLikeInfo);

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.extendedLikesInfo).toEqual({
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.None,
        });
      }
      // set dislikes
      for (let i = 0; i < createdUsers.length; i++) {
        const { user, token } = createdUsers[i];
        await request(app)
          .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[1])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        post.extendedLikesInfo.newestLikes =
          post.extendedLikesInfo.newestLikes.filter(
            ({ userId }) => userId !== user.id,
          );
        post.extendedLikesInfo.likesCount -= 1;
        post.extendedLikesInfo.dislikesCount += 1;
        expect(response.body.extendedLikesInfo).toEqual({
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.Dislike,
        });

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.extendedLikesInfo).toEqual({
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.None,
        });
      }
      // set none
      for (let i = 3; i < createdUsers.length; i++) {
        const { token } = createdUsers[i];
        await request(app)
          .put(`${FULL_PATH.POSTS}/${post.id}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send(commentDto.updateLikeStatus[2])
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(HttpStatus.OK);

        post.extendedLikesInfo.dislikesCount -= 1;
        expect(response.body.extendedLikesInfo).toEqual({
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.None,
        });

        const responseUnauth = await request(app)
          .get(`${FULL_PATH.POSTS}/${post.id}`)
          .expect(HttpStatus.OK);

        expect(responseUnauth.body.extendedLikesInfo).toEqual({
          ...post.extendedLikesInfo,
          myStatus: LikeStatus.None,
        });
      }
    });
  });

  describe(`DELETE ${FULL_PATH.POSTS}/:id`, () => {
    it('should return 404 when no post', async () => {
      await request(app)
        .delete(`${FULL_PATH.POSTS}/${validMongoId}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, [, post2]] = await createBlogAndHisPosts(2, app);

      await request(app)
        .delete(`${FULL_PATH.POSTS}/${post2.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe(`POST ${FULL_PATH.POSTS}/:id/comments`, () => {
    it('should return 401 when no accessToken', async () => {
      const [, post] = await createBlogAndHisPost(app);
      await request(app)
        .post(`${FULL_PATH.POSTS}/${post.id}/comments`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when no post whit that id', async () => {
      const { token } = await createUserAndLogin(app);
      const [, post] = await createBlogAndHisPost(app);
      await request(app)
        .delete(`${FULL_PATH.POSTS}/${post.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .post(`${FULL_PATH.POSTS}/${post.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto.create)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should create comment', async () => {
      const [comment, , , user] = await createComment(app, commentDto.create);

      expect(comment).toEqual({
        ...commentDto.create,
        commentatorInfo: {
          userId: user.id,
          userLogin: user.login,
        },
        id: expect.any(String),
        createdAt: expect.any(String),
        likesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: 'None',
        },
      });
    });
  });

  describe(`GET ${FULL_PATH.POSTS}/:id/comments`, () => {
    it('should return 404 when no post whit that id', async () => {
      const [, post] = await createBlogAndHisPost(app);
      await request(app)
        .delete(`${FULL_PATH.POSTS}/${post.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .get(`${FULL_PATH.POSTS}/${post.id}/comments`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return Paginated<[]> when no comments', async () => {
      const [, post] = await createBlogAndHisPost(app);
      const response = await request(app)
        .get(`${FULL_PATH.POSTS}/${post.id}/comments`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
      });
    });

    it('should return list of comments', async () => {
      const [, post] = await createComments(2, app);

      const response = await request(app)
        .get(`${FULL_PATH.POSTS}/${post.id}/comments`)
        .expect(HttpStatus.OK);

      expect(response.body.items.length).toBe(2);
      expect(response.body).toMatchObject({
        page: 1,
        pageSize: 10,
        pagesCount: 1,
        totalCount: 2,
      });
    });
  });
});
