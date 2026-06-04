import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGame1780578705379 implements MigrationInterface {
  name = 'AddGame1780578705379';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question" RENAME COLUMN "answers" TO "keys"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."game_status_enum" AS ENUM('Active', 'Finished', 'PendingSecondPlayer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "game" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "status" "public"."game_status_enum" NOT NULL DEFAULT 'PendingSecondPlayer', "startedAt" TIMESTAMP WITH TIME ZONE, "finishedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "pk_game_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_to_question" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "gameId" integer NOT NULL, "questionId" integer NOT NULL, CONSTRAINT "pk_game_to_question_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."answer_status_enum" AS ENUM('Correct', 'Incorrect')`,
    );
    await queryRunner.query(
      `CREATE TABLE "answer" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "playerProgressId" integer NOT NULL, "questionId" integer NOT NULL, "text" character varying NOT NULL, "status" "public"."answer_status_enum" NOT NULL, CONSTRAINT "pk_answer_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "player_progress" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" integer NOT NULL, "gameId" integer NOT NULL, "score" integer NOT NULL DEFAULT '0', CONSTRAINT "pk_player_progress_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_to_question" ADD CONSTRAINT "fk_game_to_question_game_gameId" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_to_question" ADD CONSTRAINT "fk_game_to_question_question_questionId" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "fk_answer_player_progress_playerProgressId" FOREIGN KEY ("playerProgressId") REFERENCES "player_progress"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "fk_answer_question_questionId" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "player_progress" ADD CONSTRAINT "fk_player_progress_user_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "player_progress" ADD CONSTRAINT "fk_player_progress_game_gameId" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "player_progress" DROP CONSTRAINT "fk_player_progress_game_gameId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "player_progress" DROP CONSTRAINT "fk_player_progress_user_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "fk_answer_question_questionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "fk_answer_player_progress_playerProgressId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_to_question" DROP CONSTRAINT "fk_game_to_question_question_questionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_to_question" DROP CONSTRAINT "fk_game_to_question_game_gameId"`,
    );
    await queryRunner.query(`DROP TABLE "player_progress"`);
    await queryRunner.query(`DROP TABLE "answer"`);
    await queryRunner.query(`DROP TYPE "public"."answer_status_enum"`);
    await queryRunner.query(`DROP TABLE "game_to_question"`);
    await queryRunner.query(`DROP TABLE "game"`);
    await queryRunner.query(`DROP TYPE "public"."game_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "question" RENAME COLUMN "keys" TO "answers"`,
    );
  }
}
