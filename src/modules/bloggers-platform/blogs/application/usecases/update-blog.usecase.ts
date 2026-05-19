import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateBlogDto } from '../../dto/update-blog.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class UpdateBlogCommand extends Command<void> {
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

  execute({ id, dto }: UpdateBlogCommand): Promise<void> {
    return this.repository.updateBlogOrNotFound(id, dto);
  }
}
