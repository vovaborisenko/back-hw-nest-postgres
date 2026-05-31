import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestion1780224499627 implements MigrationInterface {
  name = 'AddQuestion1780224499627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."question_status_enum" AS ENUM('draft', 'published')`,
    );
    await queryRunner.query(
      `CREATE TABLE "question" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "content" character varying NOT NULL, "answers" jsonb NOT NULL, "status" "public"."question_status_enum" NOT NULL DEFAULT 'draft', CONSTRAINT "pk_question_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TYPE "public"."question_status_enum"`);
  }
}
