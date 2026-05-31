import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question/domain/question.entity';
import { QuestionController } from './question/api/question/question.controller';
import { QuestionQueryRepository } from './question/infrastructure/question.query-repository';
import { QuestionHandles } from './question/application';
import { QuestionRepository } from './question/infrastructure/question.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [QuestionController],
  providers: [QuestionRepository, QuestionQueryRepository, ...QuestionHandles],
})
export class QuizModule {}
