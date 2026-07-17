import type {
  CreateStockMovementInput
} from "./inventory.schemas";
import { inventoryRepository } from "./inventory.repository";

export class InventoryService {
  async listMovements() {
    return inventoryRepository.listMovements();
  }

  async createMovement(
    input: CreateStockMovementInput
  ) {
    const inventory =
      await inventoryRepository.findInventoryByProduct(
        input.product_id
      );

    if (!inventory) {
      throw new Error(
        "O estoque desse produto não foi encontrado."
      );
    }

    const physicalBefore = Number(
      inventory.physical_quantity ?? 0
    );

    const reservedBefore = Number(
      inventory.reserved_quantity ?? 0
    );

    let physicalAfter = physicalBefore;
    let effectiveType: string = input.movement_type;

    if (input.movement_type === "entry") {
      physicalAfter = physicalBefore + input.quantity;
    }

    if (input.movement_type === "exit") {
      physicalAfter = physicalBefore - input.quantity;
    }

    if (input.movement_type === "adjustment") {
      if (input.adjustment_direction === "increase") {
        physicalAfter = physicalBefore + input.quantity;
        effectiveType = "adjustment_increase";
      } else {
        physicalAfter = physicalBefore - input.quantity;
        effectiveType = "adjustment_decrease";
      }
    }

    if (physicalAfter < 0) {
      throw new Error(
        `Estoque insuficiente. Quantidade física atual: ${physicalBefore}.`
      );
    }

    if (physicalAfter < reservedBefore) {
      throw new Error(
        `A quantidade física não pode ficar abaixo das ${reservedBefore} unidades reservadas.`
      );
    }

    await inventoryRepository.updatePhysicalQuantity(
      inventory.id,
      physicalAfter
    );

    try {
      await inventoryRepository.updateProductStock(
        input.product_id,
        physicalAfter
      );

      const movement =
        await inventoryRepository.createMovement({
          inventory_id: inventory.id,
          product_id: input.product_id,
          movement_type: effectiveType,
          quantity: input.quantity,
          physical_before: physicalBefore,
          physical_after: physicalAfter,
          reserved_before: reservedBefore,
          reserved_after: reservedBefore,
          reason: input.reason,
          metadata: {
            notes: input.notes ?? null,
            adjustment_direction:
              input.adjustment_direction ?? null
          }
        });

      return {
        movement,
        inventory: {
          id: inventory.id,
          product_id: input.product_id,
          physical_before: physicalBefore,
          physical_after: physicalAfter,
          reserved_quantity: reservedBefore,
          available_quantity:
            physicalAfter - reservedBefore
        }
      };
    } catch (error) {
      await inventoryRepository.updatePhysicalQuantity(
        inventory.id,
        physicalBefore
      );

      await inventoryRepository.updateProductStock(
        input.product_id,
        physicalBefore
      );

      throw error;
    }
  }
}

export const inventoryService =
  new InventoryService();