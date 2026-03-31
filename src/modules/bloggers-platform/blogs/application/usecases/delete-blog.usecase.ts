import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeleteBlogCommand extends Command<true> {
  constructor(public readonly id: number) {
    super();
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(protected readonly repository: BlogsRepository) {}

  async execute({ id }: DeleteBlogCommand): Promise<true> {
    const isDeleted = await this.repository.deleteBlog(id);

    if (!isDeleted) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return isDeleted;
  }
}
