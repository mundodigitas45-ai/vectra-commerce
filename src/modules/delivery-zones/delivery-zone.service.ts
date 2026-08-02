import { deliveryZoneRepository } from "./delivery-zone.repository";

import type {
  CreateDeliveryZoneInput,
  UpdateDeliveryZoneInput
} from "./delivery-zone.schemas";

function normalizeNeighborhood(
  neighborhood: string
): string {
  return neighborhood
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
}

function validateDeliveryFee(
  deliveryFee: number
): void {
  const allowedFees = [0, 10, 15, 20];

  if (!allowedFees.includes(deliveryFee)) {
    throw new Error("INVALID_DELIVERY_FEE");
  }
}

export class DeliveryZoneService {
  list() {
    return deliveryZoneRepository.list();
  }

  async findById(zoneId: string) {
    const zone =
      await deliveryZoneRepository.findById(
        zoneId
      );

    if (!zone) {
      throw new Error(
        "DELIVERY_ZONE_NOT_FOUND"
      );
    }

    return zone;
  }

  async create(input: CreateDeliveryZoneInput) {
    validateDeliveryFee(input.delivery_fee);

    const normalizedNeighborhood =
      normalizeNeighborhood(input.neighborhood);

    const existing =
      await deliveryZoneRepository
        .findByNormalizedNeighborhood(
          normalizedNeighborhood
        );

    if (existing) {
      throw new Error(
        "DELIVERY_ZONE_ALREADY_EXISTS"
      );
    }

    return deliveryZoneRepository.create(
      input,
      normalizedNeighborhood
    );
  }

  async update(
    zoneId: string,
    input: UpdateDeliveryZoneInput
  ) {
    await this.findById(zoneId);

    if (input.delivery_fee !== undefined) {
      validateDeliveryFee(
        input.delivery_fee
      );
    }

    let normalizedNeighborhood:
      | string
      | undefined;

    if (input.neighborhood !== undefined) {
      normalizedNeighborhood =
        normalizeNeighborhood(
          input.neighborhood
        );

      const existing =
        await deliveryZoneRepository
          .findByNormalizedNeighborhood(
            normalizedNeighborhood,
            zoneId
          );

      if (existing) {
        throw new Error(
          "DELIVERY_ZONE_ALREADY_EXISTS"
        );
      }
    }

    return deliveryZoneRepository.update(
      zoneId,
      input,
      normalizedNeighborhood
    );
  }

  async updateStatus(
    zoneId: string,
    isActive: boolean
  ) {
    await this.findById(zoneId);

    return deliveryZoneRepository.updateStatus(
      zoneId,
      isActive
    );
  }
}

export const deliveryZoneService =
  new DeliveryZoneService();
