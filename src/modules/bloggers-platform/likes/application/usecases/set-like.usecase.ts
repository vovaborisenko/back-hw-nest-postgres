import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetLikeDto } from '../../dto/set-like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';

export class SetLikeCommand extends Command<void> {
  constructor(public readonly dto: SetLikeDto) {
    super();
  }
}

@CommandHandler(SetLikeCommand)
export class SetLikeUseCase implements ICommandHandler<SetLikeCommand> {
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute({ dto }: SetLikeCommand): Promise<void> {
    const like = await this.likesRepository.findUserLike(dto);

    if (like) {
      await this.likesRepository.updateLike(like.id, dto.status);

      return;
    }

    await this.likesRepository.createLike(dto);
  }
}
