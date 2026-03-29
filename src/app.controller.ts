import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { PATH } from './core/constants/paths';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Delete(`${PATH.TESTING.PREFIX}/${PATH.TESTING.ALL}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  dropData(): Promise<void> {
    return this.appService.dropDatabase();
  }
}
