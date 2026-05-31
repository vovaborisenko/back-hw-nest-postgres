import { CreateQuestionUseCase } from './usecases/create-question.use-case';
import { DeleteQuestionUseCase } from './usecases/delete-question.use-case';
import { UpdateQuestionUseCase } from './usecases/update-question.use-case';
import { UpdateQuestionStatusUseCase } from './usecases/update-question-status.use-case';

export const QuestionHandles = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  UpdateQuestionStatusUseCase,
];
