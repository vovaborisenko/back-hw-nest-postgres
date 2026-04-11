import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostDto } from '../../dto/update-post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class UpdatePostCommand extends Command<true> {
  constructor(
    public readonly id: number,
    public readonly dto: UpdatePostDto,
  ) {
    super();
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(protected readonly repository: PostsRepository) {}

  async execute({ id, dto }: UpdatePostCommand): Promise<true> {
    const isUpdated = await this.repository.updatePost(id, dto);

    if (!isUpdated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return isUpdated;
  }
}
