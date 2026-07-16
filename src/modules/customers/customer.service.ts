import { customerRepository } from "./customer.repository";

export class CustomerService {
  async list() {
    return await customerRepository.list();
  }
}

export const customerService = new CustomerService();