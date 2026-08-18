import { creativeWorkerRepository } from "./creative-worker.repository";
import type {
  ClaimCreativeJobInput,
  CompleteCreativeJobInput,
  FailCreativeJobInput
} from "./creative-worker.schemas";

export class CreativeWorkerService {
  claim(input: ClaimCreativeJobInput) {
    return creativeWorkerRepository.claim(input);
  }

  complete(
    jobId: string,
    input: CompleteCreativeJobInput
  ) {
    return creativeWorkerRepository.complete(
      jobId,
      input
    );
  }

  fail(
    jobId: string,
    input: FailCreativeJobInput
  ) {
    return creativeWorkerRepository.fail(
      jobId,
      input
    );
  }
}

export const creativeWorkerService =
  new CreativeWorkerService();
