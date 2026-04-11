import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateBlogDto } from '../../dto/update-blog.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class UpdateBlogCommand extends Command<true> {
  constructor(
    public readonly id: number,
    public readonly dto: UpdateBlogDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(protected readonly repository: BlogsRepository) {}

  async execute({ id, dto }: UpdateBlogCommand): Promise<true> {
    const isUpdated = await this.repository.updateBlog(id, dto);

    if (!isUpdated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return isUpdated;
  }
}
