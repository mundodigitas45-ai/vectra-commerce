import { customerRepository } from "./customer.repository";
import type { CreateCustomerInput } from "./customer.schemas";

export class CustomerService {
  async list() {
    return customerRepository.list();
  }

  async create(input: CreateCustomerInput) {
    const existingCustomer =
      await customerRepository.findByPhone(input.phone);

    if (existingCustomer) {
      throw new Error(
        "Já existe um cliente cadastrado com esse telefone."
      );
    }

    return customerRepository.create(input);
  }
}

export const customerService =
  new CustomerService();