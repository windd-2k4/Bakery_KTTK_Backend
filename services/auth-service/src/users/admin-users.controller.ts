import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth/admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // USERS
  // ==========================================
  @Get('users')
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
    return { success: true, message: 'User deleted successfully' };
  }

  // ==========================================
  // EMPLOYEES
  // ==========================================
  @Get('employees')
  async getAllEmployees() {
    return this.usersService.findByRole('EMPLOYEE');
  }

  @Post('employees')
  async createEmployee(@Body() data: any) {
    const plainPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const employeeData = {
      ...data,
      role: 'EMPLOYEE',
      password: hashedPassword,
    };
    return this.usersService.create(employeeData);
  }

  @Put('employees/:id')
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    // Prevent changing role via this endpoint
    delete data.role;
    delete data.password; // Don't allow password update here
    return this.usersService.update(id, data);
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  @Get('customers')
  async getAllCustomers() {
    return this.usersService.findByRole('CUSTOMER');
  }

  @Post('customers')
  async createCustomer(@Body() data: any) {
    const plainPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const customerData = {
      ...data,
      role: 'CUSTOMER',
      password: hashedPassword,
    };
    return this.usersService.create(customerData);
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    // Prevent changing role via this endpoint
    delete data.role;
    delete data.password;
    return this.usersService.update(id, data);
  }
}
