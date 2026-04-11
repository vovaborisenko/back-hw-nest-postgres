import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeletePostCommand extends Command<true> {
  constructor(public readonly id: number) {
    super();
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(protected readonly repository: PostsRepository) {}

  async execute({ id }: DeletePostCommand): Promise<true> {
    const isDeleted = await this.repository.deletePost(id);

    if (!isDeleted) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return isDeleted;
  }
}
