import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetLikeDto } from '../../dto/set-like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { Like } from '../../domain/like.entity';

export class SetLikeCommand extends Command<void> {
  constructor(public readonly dto: SetLikeDto) {
    super();
  }
}

@CommandHandler(SetLikeCommand)
export class SetLikeUseCase implements ICommandHandler<SetLikeCommand> {
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute({ dto }: SetLikeCommand): Promise<void> {
    const like =
      (await this.likesRepository.findUserLike(dto)) || Like.create(dto);

    like.status = dto.status;

    await this.likesRepository.save(like);
  }
}
