import { Injectable } from '@nestjs/common';
import { UserRaw } from '../domain/user.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private readonly datasource: DataSource) {}

  async createUser(dto: CreateUserDomainDto): Promise<{
    id: number;
    confirmationCode: string;
  }> {
    const [{ id }] = await this.datasource.query<{ id: number }[]>(
      `
    INSERT INTO users (login, email, password_hash) 
    VALUES ($1, $2, $3)
    RETURNING id
    `,
      [dto.login, dto.email, dto.passwordHash],
    );
    const [{ confirmation_code }] = await this.datasource.query<
      {
        confirmation_code: string;
      }[]
    >(
      `
    INSERT INTO email_confirmation (expiration_date, user_id) 
    VALUES ($1, $2)
    RETURNING confirmation_code
    `,
      [new Date(Date.now() + 3.6e6), id],
    );

    return {
      id,
      confirmationCode: confirmation_code,
    };
  }

  async updatePasswordHash(
    recoveryCode: string,
    hash: string,
  ): Promise<boolean> {
    const [, updatedCount] = await this.datasource.query<[[], number]>(
      `
    UPDATE users
    SET password_hash = $1
    WHERE deleted_at is NULL AND id in (
      SELECT ur.user_id
      FROM user_recovery as ur
      WHERE ur.code = $2 AND ur.expired_at > $3
    ) 
    `,
      [hash, recoveryCode, new Date()],
    );

    if (updatedCount > 0) {
      await this.datasource.query<[[], number]>(
        `
        DELETE FROM user_recovery
        WHERE code = $1
      `,
        [recoveryCode],
      );
    }

    return updatedCount > 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [, deletedCount] = await this.datasource.query<
      [{ id: number }[] | undefined, number]
    >(
      `
    UPDATE users
    SET deleted_at = $2
    WHERE id = $1 AND deleted_at is NULL
    `,
      [id, new Date()],
    );

    return deletedCount > 0;
  }

  async findById(id: number): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users 
      WHERE id = $1 AND deleted_at is null`,
      [id],
    );

    return user;
  }

  async findByIdOrNotFountFail(id: number): Promise<UserRaw> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return user;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users 
      WHERE (login = $1 OR email = $1) AND deleted_at is null`,
      [loginOrEmail],
    );

    return user;
  }

  async findByLogin(login: string): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT *
       FROM users
       WHERE login = $1 AND deleted_at is null`,
      [login],
    );

    return user;
  }

  async findByEmail(email: string): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users 
      WHERE email = $1 AND deleted_at is null`,
      [email],
    );

    return user;
  }

  async findByEmailConfirmationCode(code: string): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users as u
      LEFT JOIN email_confirmation as ec ON u.id = ec.user_id
      WHERE ec.confirmation_code = $1 AND u.deleted_at is null`,
      [code],
    );

    return user;
  }

  async updateEmailConfirmationCode(email: string): Promise<string | null> {
    const newCode = crypto.randomUUID();
    const [, updatedCount] = await this.datasource.query<[[], number]>(
      `
        UPDATE email_confirmation
        SET confirmation_code = $1
        WHERE is_confirmed = false AND user_id IN (
          SELECT id
          FROM users as u
          WHERE u.email = $2 AND u.deleted_at is null
          LIMIT 1
        )
      `,
      [newCode, email],
    );

    return updatedCount > 0 ? newCode : null;
  }

  async confirmEmail(code: string): Promise<boolean> {
    const [, updatedCount] = await this.datasource.query<[[], number]>(
      `
      UPDATE email_confirmation
      SET is_confirmed = true
      WHERE confirmation_code = $2 AND is_confirmed = false AND expiration_date > $1
      `,
      [new Date(), code],
    );

    return updatedCount > 0;
  }

  async findByRecoveryCode(code: string): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users as u
      LEFT JOIN user_recovery as ur ON u.id = ur.user_id
      WHERE ur.code = $1 AND ur.expiration_date > $2 AND u.deleted_at is null`,
      [code, new Date()],
    );

    return user;
  }

  async createRecovery(userId: number): Promise<string> {
    const [{ code }] = await this.datasource.query<{ code: string }[]>(
      `
        INSERT INTO user_recovery (user_id, expired_at)
        VALUES ($1, $2)
        RETURNING code`,
      [userId, new Date(Date.now() + 3.6e6)],
    );

    return code;
  }
}
