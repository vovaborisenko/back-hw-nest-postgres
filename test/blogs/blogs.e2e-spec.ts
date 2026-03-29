import request from 'supertest';
import { invalidAuth, validAuth, validMongoId } from '../constants/common';
import { blogDto, createBlog, createBlogs } from '../utils/blog/blog.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';

describe('BlogsController (e2e)', () => {
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
    path                             | method
    ${FULL_PATH.BLOGS}               | ${'post'}
    ${FULL_PATH.BLOGS + '/12'}       | ${'put'}
    ${FULL_PATH.BLOGS + '/12'}       | ${'delete'}
    ${FULL_PATH.BLOGS + '/12/posts'} | ${'post'}
  `(
    'should return 401 when invalid header Authorization: [$method] $path',
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

  describe(`POST ${FULL_PATH.BLOGS}`, () => {
    it('should create', async () => {
      const blog = await createBlog(app, blogDto.create);

      expect(blog).toEqual({
        ...blogDto.create,
        isMembership: false,
        id: expect.any(String),
        createdAt: expect.any(String),
      });
    });
  });

  describe(`GET ${FULL_PATH.BLOGS}`, () => {
    it('should return [] when no blogs', async () => {
      const response = await request(app)
        .get(FULL_PATH.BLOGS)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
      });
    });

    it('should return list of blogs', async () => {
      const [blog1, blog2] = await createBlogs(2, app);
      const response = await request(app)
        .get(FULL_PATH.BLOGS)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [blog2, blog1],
        page: 1,
        pageSize: 10,
        pagesCount: 1,
        totalCount: 2,
      });
    });
  });

  describe(`GET ${FULL_PATH.BLOGS}/:id`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .get(`${FULL_PATH.BLOGS}/${validMongoId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return blog with requested id', async () => {
      const [, blog2] = await createBlogs(2, app);

      const response = await request(app)
        .get(`${FULL_PATH.BLOGS}/${blog2.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(blog2);
    });
  });

  describe(`PUT ${FULL_PATH.BLOGS}/:id`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .put(`${FULL_PATH.BLOGS}/${validMongoId}`)
        .set('Authorization', validAuth)
        .send(blogDto.update)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [blog1, blog2] = await createBlogs(2, app);

      await request(app)
        .put(`${FULL_PATH.BLOGS}/${blog1.id}`)
        .set('Authorization', validAuth)
        .send({ ...blogDto.update, minAgeRestriction: null })
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .put(`${FULL_PATH.BLOGS}/${blog2.id}`)
        .set('Authorization', validAuth)
        .send(blogDto.update)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(`${FULL_PATH.BLOGS}/${blog2.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(blogDto.update);
    });
  });

  describe(`DELETE ${FULL_PATH.BLOGS}/:id`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .delete(`${FULL_PATH.BLOGS}/${validMongoId}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, blog2] = await createBlogs(2, app);

      await request(app)
        .delete(`${FULL_PATH.BLOGS}/${blog2.id}`)
        .set('Authorization', validAuth)
        .expect(HttpStatus.NO_CONTENT);
    });
  });

  describe('Test blog-posts', () => {
    const newPost = {
      title: 'Новые возможности TypeScript',
      shortDescription: 'Обзор новых фич и улучшений в TypeScript',
      content:
        'TypeScript 5.0 представляет множество улучшений производительности и новые возможности...',
    };

    describe(`POST ${FULL_PATH.BLOGS}/:id/posts`, () => {
      it('should return 400 if not exist blog', async () => {
        await request(app)
          .post(`${FULL_PATH.BLOGS}/${validMongoId}/posts`)
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should create', async () => {
        const blog = await createBlog(app);
        const response = await request(app)
          .post(`${FULL_PATH.BLOGS}/${blog.id}/posts`)
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          ...newPost,
          blogId: blog.id,
          blogName: blog.name,
        });
      });
    });

    describe(`GET ${FULL_PATH.BLOGS}/:id/posts`, () => {
      it('should return 404 if not exist blog', async () => {
        await request(app)
          .get(`${FULL_PATH.BLOGS}/${validMongoId}/posts`)
          .set('Authorization', validAuth)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return Paginated<[]> when no posts', async () => {
        const blog = await createBlog(app);
        const response = await request(app)
          .get(`${FULL_PATH.BLOGS}/${blog.id}/posts`)
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
        const [blog, blog2] = await createBlogs(2, app);

        await request(app)
          .post(`${FULL_PATH.BLOGS}/${blog.id}/posts`)
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);
        await request(app)
          .post(`${FULL_PATH.BLOGS}/${blog2.id}/posts`)
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);
        await request(app)
          .post(`${FULL_PATH.BLOGS}/${blog.id}/posts`)
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);

        const response = await request(app)
          .get(`${FULL_PATH.BLOGS}/${blog.id}/posts`)
          .expect(HttpStatus.OK);

        expect(response.body.items.length).toBe(2);

        const response2 = await request(app)
          .get(`${FULL_PATH.BLOGS}/${blog2.id}/posts`)
          .expect(HttpStatus.OK);

        expect(response2.body.items.length).toBe(1);
      });
    });
  });
});
