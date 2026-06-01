export enum OrderStatus {
  PENDING   = 'PENDING',
  PAID      = 'PAID',
  CONFIRMED = 'CONFIRMED',
  BAKING    = 'BAKING',
  READY     = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
}
 
// State Machine — ai được phép chuyển sang trạng thái nào
export const TRANSITIONS: Record<string, {
  from: OrderStatus[], role: string[]
}> = {
  [OrderStatus.PAID]: {
    from:  [OrderStatus.PENDING],
    role:  ['SYSTEM', 'CUSTOMER'],
  },
  [OrderStatus.CONFIRMED]: {
    from:  [OrderStatus.PENDING, OrderStatus.PAID],
    role:  ['ADMIN'],
  },
  [OrderStatus.BAKING]: {
    from:  [OrderStatus.CONFIRMED],
    role:  ['BAKER'],
  },
  [OrderStatus.READY]: {
    from:  [OrderStatus.BAKING],
    role:  ['BAKER'],
  },
  [OrderStatus.COMPLETED]: {
    from:  [OrderStatus.READY],
    role:  ['CUSTOMER'],
  },
  [OrderStatus.CANCELLED]: {
    from:  [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.CONFIRMED],
    role:  ['CUSTOMER', 'ADMIN', 'SYSTEM'],
  },
  [OrderStatus.REFUND_PENDING]: {
    from: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
    role: ['ADMIN'],
  },
};