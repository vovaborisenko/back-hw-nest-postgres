import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerStat1781014491478 implements MigrationInterface {
  name = 'AddPlayerStat1781014491478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."player_progress_gameresult_enum" AS ENUM('DRAW', 'LOSE', 'WIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "player_progress" ADD "gameResult" "public"."player_progress_gameresult_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "player_progress" DROP COLUMN "gameResult"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."player_progress_gameresult_enum"`,
    );
  }
}
