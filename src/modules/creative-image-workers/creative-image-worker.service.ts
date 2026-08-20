import { creativeImageWorkerRepository } from "./creative-image-worker.repository";
import type {
  ClaimCreativeImageJobInput,
  CompleteCreativeImageJobInput,
  FailCreativeImageJobInput
} from "./creative-image-worker.schemas";

export class CreativeImageWorkerService {
  claim(input: ClaimCreativeImageJobInput) {
    return creativeImageWorkerRepository.claim(input);
  }

  complete(
    jobId: string,
    input: CompleteCreativeImageJobInput
  ) {
    return creativeImageWorkerRepository.complete(
      jobId,
      input
    );
  }

  fail(
    jobId: string,
    input: FailCreativeImageJobInput
  ) {
    return creativeImageWorkerRepository.fail(
      jobId,
      input
    );
  }
}

export const creativeImageWorkerService =
  new CreativeImageWorkerService();
