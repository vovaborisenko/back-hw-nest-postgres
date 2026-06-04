export class AnswerAddedEvent {
  constructor(
    public readonly answerId: number,
    public readonly playerProgressId: number,
    public readonly gameId: number,
  ) {}
}
