import { Extension } from '../domain-exceptions';
// import { DomainExceptionCode } from '../domain-exception-code';

export interface ErrorResponseBody {
  // timestamp: string;
  // path: string | null;
  // message: string;
  errorsMessages: Extension[];
  // code: DomainExceptionCode;
}
