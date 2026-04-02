import request from 'supertest';
import { invalidAuth, validAuth, validParamId } from '../constants/common';
import { blogDto, createBlog, createBlogs } from '../utils/blog/blog.util';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { initTestApp } from '../utils/core/init-test-app';
import { deleteAllData } from '../utils/core/delete-all-data';
import { FULL_PATH } from '../../src/core/constants/paths';
import {
  createBlogAndHisPost,
  createBlogAndHisPosts,
  postDto,
} from '../utils/post/post.util';

function getPath(
  pathTemplate: string,
  id: number | string,
  postId: number | string = ':postId',
) {
  return pathTemplate
    .replace(':id', id.toString())
    .replace(':postId', postId.toString());
}

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
    pathTemplate               | method
    ${FULL_PATH.SA_BLOGS}      | ${'post'}
    ${FULL_PATH.SA_BLOG}       | ${'put'}
    ${FULL_PATH.SA_BLOG}       | ${'delete'}
    ${FULL_PATH.SA_BLOG_POSTS} | ${'post'}
    ${FULL_PATH.SA_BLOG_POST}  | ${'put'}
    ${FULL_PATH.SA_BLOG_POST}  | ${'delete'}
  `(
    'should return 401 when invalid header Authorization: [$method] $pathTemplate',
    async ({
      pathTemplate,
      method,
    }: {
      pathTemplate: string;
      method: 'post' | 'put' | 'delete';
    }) => {
      const path = getPath(pathTemplate, 12, 34);
      await request(app)[method](path).expect(HttpStatus.UNAUTHORIZED);
      await request(app)
        [method](path)
        .set('Authorization', invalidAuth)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  describe(`POST ${FULL_PATH.SA_BLOGS}`, () => {
    it('should create blog', async () => {
      const blog = await createBlog(app, blogDto.create);

      expect(blog).toEqual({
        ...blogDto.create,
        isMembership: false,
        id: expect.any(String),
        createdAt: expect.any(String),
      });
    });
  });

  describe.each`
    path
    ${FULL_PATH.BLOGS}
    ${FULL_PATH.SA_BLOGS}
  `(`GET $path`, ({ path }) => {
    it('should return [] when no blogs', async () => {
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

    it('should return list of blogs', async () => {
      const [blog1, blog2] = await createBlogs(2, app);
      const response = await request(app)
        .get(path)
        .set('Authorization', validAuth)
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

  describe(`GET ${FULL_PATH.BLOG}`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .get(getPath(FULL_PATH.BLOG, validParamId))
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return blog with requested id', async () => {
      const [, blog2] = await createBlogs(2, app);

      const response = await request(app)
        .get(getPath(FULL_PATH.BLOG, blog2.id))
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(blog2);
    });
  });

  describe(`PUT ${FULL_PATH.SA_BLOG}`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .put(getPath(FULL_PATH.SA_BLOG, validParamId))
        .set('Authorization', validAuth)
        .send(blogDto.update)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [blog1, blog2] = await createBlogs(2, app);

      await request(app)
        .put(getPath(FULL_PATH.SA_BLOG, blog1.id))
        .set('Authorization', validAuth)
        .send({ ...blogDto.update, minAgeRestriction: null })
        .expect(HttpStatus.NO_CONTENT);
      await request(app)
        .put(getPath(FULL_PATH.SA_BLOG, blog2.id))
        .set('Authorization', validAuth)
        .send(blogDto.update)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app)
        .get(getPath(FULL_PATH.BLOG, blog2.id))
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(blogDto.update);
    });
  });

  describe(`DELETE ${FULL_PATH.SA_BLOG}`, () => {
    it('should return 404 when no blog', async () => {
      await request(app)
        .delete(getPath(FULL_PATH.SA_BLOG, validParamId))
        .set('Authorization', validAuth)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 204 when requested id exist', async () => {
      const [, blog2] = await createBlogs(2, app);

      await request(app)
        .delete(getPath(FULL_PATH.SA_BLOG, blog2.id))
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

    describe(`POST ${FULL_PATH.SA_BLOG_POSTS}`, () => {
      it('should return 400 if not exist blog', async () => {
        await request(app)
          .post(getPath(FULL_PATH.SA_BLOG_POSTS, validParamId))
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should create', async () => {
        const blog = await createBlog(app);
        const response = await request(app)
          .post(getPath(FULL_PATH.SA_BLOG_POSTS, blog.id))
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

    describe(`PUT ${FULL_PATH.SA_BLOG_POST}`, () => {
      it('should return 404 when no post', async () => {
        const blog = await createBlog(app);
        await request(app)
          .put(getPath(FULL_PATH.SA_BLOG_POST, blog.id, validParamId))
          .set('Authorization', validAuth)
          .send({ ...postDto.update, blogId: blog.id })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 404 if not exist blog', async () => {
        const [, post] = await createBlogAndHisPost(app);

        await request(app)
          .put(getPath(FULL_PATH.SA_BLOG_POST, validParamId, post.id))
          .set('Authorization', validAuth)
          .send({ ...postDto.create, blogId: undefined })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 204 when requested id exist', async () => {
        const [blog, [post1, post2]] = await createBlogAndHisPosts(2, app);
        const editedPost = { ...postDto.update, blogId: blog.id };

        await request(app)
          .put(getPath(FULL_PATH.SA_BLOG_POST, blog.id, post1.id))
          .set('Authorization', validAuth)
          .send({ ...editedPost, title: 'updated title' })
          .expect(HttpStatus.NO_CONTENT);
        await request(app)
          .put(getPath(FULL_PATH.SA_BLOG_POST, blog.id, post2.id))
          .set('Authorization', validAuth)
          .send(editedPost)
          .expect(HttpStatus.NO_CONTENT);

        const response = await request(app)
          .get(`${FULL_PATH.POSTS}/${post2.id}`)
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject(editedPost);
      });
    });

    describe(`DELETE ${FULL_PATH.SA_BLOG_POST}`, () => {
      it('should return 404 when no post', async () => {
        const blog = await createBlog(app);
        await request(app)
          .delete(getPath(FULL_PATH.SA_BLOG_POST, blog.id, validParamId))
          .set('Authorization', validAuth)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 404 if not exist blog', async () => {
        const [, post] = await createBlogAndHisPost(app);

        await request(app)
          .delete(getPath(FULL_PATH.SA_BLOG_POST, validParamId, post.id))
          .set('Authorization', validAuth)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 204 when requested id exist', async () => {
        const [blog, [, post2]] = await createBlogAndHisPosts(2, app);

        await request(app)
          .delete(getPath(FULL_PATH.SA_BLOG_POST, blog.id, post2.id))
          .set('Authorization', validAuth)
          .expect(HttpStatus.NO_CONTENT);
      });
    });

    describe.each`
      pathTemplate
      ${FULL_PATH.BLOG_POSTS}
      ${FULL_PATH.SA_BLOG_POSTS}
    `(`GET $pathTemplate`, ({ pathTemplate }) => {
      it('should return 404 if not exist blog', async () => {
        await request(app)
          .get(getPath(pathTemplate, validParamId))
          .set('Authorization', validAuth)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return Paginated<[]> when no posts', async () => {
        const blog = await createBlog(app);
        const response = await request(app)
          .get(getPath(pathTemplate, blog.id))
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

      it('should return list of posts', async () => {
        const [blog, blog2] = await createBlogs(2, app);

        await request(app)
          .post(getPath(FULL_PATH.SA_BLOG_POSTS, blog.id))
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);
        await request(app)
          .post(getPath(FULL_PATH.SA_BLOG_POSTS, blog2.id))
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);
        await request(app)
          .post(getPath(FULL_PATH.SA_BLOG_POSTS, blog.id))
          .set('Authorization', validAuth)
          .send(newPost)
          .expect(HttpStatus.CREATED);

        const response = await request(app)
          .get(getPath(pathTemplate, blog.id))
          .set('Authorization', validAuth)
          .expect(HttpStatus.OK);

        expect(response.body.items.length).toBe(2);

        const response2 = await request(app)
          .get(getPath(pathTemplate, blog2.id))
          .set('Authorization', validAuth)
          .expect(HttpStatus.OK);

        expect(response2.body.items.length).toBe(1);
      });
    });
  });
});
