import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1780148228337 implements MigrationInterface {
  name = 'Init1780148228337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "email_confirmation" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "expirationDate" TIMESTAMP WITH TIME ZONE NOT NULL, "confirmationCode" uuid NOT NULL, "isConfirmed" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, CONSTRAINT "REL_28d3d3fbd7503f3428b94fd18c" UNIQUE ("userId"), CONSTRAINT "pk_email_confirmation_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recovery" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "expiredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "code" uuid NOT NULL, "userId" integer NOT NULL, CONSTRAINT "REL_318d006fbaa2a2aa666c3af387" UNIQUE ("userId"), CONSTRAINT "pk_recovery_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "security_device" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "deviceName" character varying NOT NULL, "deviceId" uuid NOT NULL, "expiredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "ip" character varying, "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" integer NOT NULL, CONSTRAINT "pk_security_device_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" character varying NOT NULL, "websiteUrl" character varying NOT NULL, "isMembership" boolean NOT NULL DEFAULT false, CONSTRAINT "pk_blog_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "shortDescription" character varying NOT NULL, "content" character varying NOT NULL, "blogId" integer, CONSTRAINT "pk_post_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comment" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "content" character varying NOT NULL, "postId" integer NOT NULL, "authorId" integer NOT NULL, CONSTRAINT "pk_comment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "login" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "uq_user_login" UNIQUE ("login"), CONSTRAINT "uq_user_email" UNIQUE ("email"), CONSTRAINT "pk_user_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."like_status_enum" AS ENUM('None', 'Like', 'Dislike')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."like_parenttype_enum" AS ENUM('comments', 'posts')`,
    );
    await queryRunner.query(
      `CREATE TABLE "like" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "status" "public"."like_status_enum" NOT NULL, "authorId" integer NOT NULL, "parentId" integer NOT NULL, "parentType" "public"."like_parenttype_enum" NOT NULL, CONSTRAINT "pk_like_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_confirmation" ADD CONSTRAINT "fk_email_confirmation_user_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery" ADD CONSTRAINT "fk_recovery_user_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "security_device" ADD CONSTRAINT "fk_security_device_user_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post" ADD CONSTRAINT "fk_post_blog_blogId" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_post_postId" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_authorId" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "like" ADD CONSTRAINT "fk_like_user_authorId" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "like" DROP CONSTRAINT "fk_like_user_authorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_user_authorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_post_postId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post" DROP CONSTRAINT "fk_post_blog_blogId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "security_device" DROP CONSTRAINT "fk_security_device_user_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recovery" DROP CONSTRAINT "fk_recovery_user_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_confirmation" DROP CONSTRAINT "fk_email_confirmation_user_userId"`,
    );
    await queryRunner.query(`DROP TABLE "like"`);
    await queryRunner.query(`DROP TYPE "public"."like_parenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."like_status_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "comment"`);
    await queryRunner.query(`DROP TABLE "post"`);
    await queryRunner.query(`DROP TABLE "blog"`);
    await queryRunner.query(`DROP TABLE "security_device"`);
    await queryRunner.query(`DROP TABLE "recovery"`);
    await queryRunner.query(`DROP TABLE "email_confirmation"`);
  }
}
