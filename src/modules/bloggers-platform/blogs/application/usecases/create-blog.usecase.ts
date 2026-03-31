import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class CreateBlogCommand extends Command<number> {
  constructor(public readonly dto: CreateBlogDto) {
    super();
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(protected readonly repository: BlogsRepository) {}

  execute({ dto }: CreateBlogCommand): Promise<number> {
    return this.repository.createBlog(dto);
  }
}
