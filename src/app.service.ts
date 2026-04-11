import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async dropDatabase(): Promise<void> {
    const collections = this.connection.collections;
    await this.dataSource.query(`
TRUNCATE TABLE users, email_confirmation, user_recovery, security_devices, blogs  
RESTART IDENTITY CASCADE;`);
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  }
}
