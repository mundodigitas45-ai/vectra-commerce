import { supabase } from "../../config/supabase";
import { productRepository } from "./product.repository";
import type {
  CreateProductInput,
  UpdateProductInput
} from "./product.schemas";

function createSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class ProductService {
  async list() {
    const { data, error } = await supabase
      .from("inventory_summary")
      .select(`
        product_id,
        product_name,
        product_slug,
        sale_price,
        cost_price,
        available_quantity,
        minimum_quantity,
        is_low_stock
      `)
      .order("product_name");

    if (error) {
      throw error;
    }

    return data;
  }

  findById(productId: string) {
    return productRepository.findById(productId);
  }

  async create(
    input: CreateProductInput,
    actorEmail: string
  ) {
    return productRepository.create(
      {
        ...input,
        slug:
          input.slug?.trim() ||
          createSlug(input.name)
      },
      actorEmail
    );
  }

  async update(
    productId: string,
    input: UpdateProductInput
  ) {
    const normalized = {
      ...input,
      slug:
        input.slug !== undefined
          ? createSlug(input.slug)
          : undefined
    };

    if (
      normalized.maximum_quantity !== undefined &&
      normalized.maximum_quantity !== null &&
      normalized.minimum_quantity !== undefined &&
      normalized.maximum_quantity <
        normalized.minimum_quantity
    ) {
      throw new Error("INVALID_MAXIMUM_QUANTITY");
    }

    return productRepository.update(
      productId,
      normalized
    );
  }

  updateStatus(
    productId: string,
    isActive: boolean
  ) {
    return productRepository.updateStatus(
      productId,
      isActive
    );
  }
}

export const productService =
  new ProductService();
