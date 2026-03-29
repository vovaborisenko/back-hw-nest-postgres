import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetLikeDto } from '../../dto/set-like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Like, type LikeModelType } from '../../domain/like.entity';

export class SetLikeCommand extends Command<void> {
  constructor(public readonly dto: SetLikeDto) {
    super();
  }
}

@CommandHandler(SetLikeCommand)
export class SetLikeUseCase implements ICommandHandler<SetLikeCommand> {
  constructor(
    @InjectModel(Like.name) private readonly LikeModel: LikeModelType,
    private readonly likesRepository: LikesRepository,
  ) {}

  async execute({ dto }: SetLikeCommand): Promise<void> {
    let like = await this.likesRepository.findByAuthorAndParent(
      dto.author,
      dto.parent,
    );

    if (like) {
      like.update(dto);
    } else {
      like = this.LikeModel.createInstance(dto);
    }

    await this.likesRepository.save(like);
  }
}
