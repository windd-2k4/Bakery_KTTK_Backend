import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../enums/order-status.enum';

// Define valid state transitions using the project's OrderStatus/TRANSITIONS
import { TRANSITIONS } from '../enums/order-status.enum';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = Object.keys(TRANSITIONS).reduce((acc, to) => {
  const cfg = TRANSITIONS[to as keyof typeof TRANSITIONS];
  cfg.from.forEach((from: OrderStatus) => {
    acc[from] = acc[from] || [];
    acc[from].push(to as OrderStatus);
  });
  return acc;
}, {} as Record<OrderStatus, OrderStatus[]>);

@Injectable()
export class OrderTransitionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { currentStatus, newStatus } = request;

    if (!currentStatus || !newStatus) {
      throw new BadRequestException('Current status and new status are required');
    }

    const validTransitions = VALID_TRANSITIONS[currentStatus];

    if (!validTransitions || !validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions?.join(', ') || 'none'}`,
      );
    }

    return true;
  }
}
