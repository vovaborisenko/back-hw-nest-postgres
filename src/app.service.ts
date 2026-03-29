import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'Hello World!';
  }

  async dropDatabase(): Promise<void> {
    const collections = this.connection.collections;

    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  }
}
