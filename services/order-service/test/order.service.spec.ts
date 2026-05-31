import { OrderService } from '../src/order/order.service';
import { OrderPublisher } from '../src/order/order.publisher';
import { CatalogAuthClient } from '../src/order/clients/catalog-auth.client';
import { OrderRepository } from '../src/order/repositories/order.repository';
import { DataSource } from 'typeorm';

describe('OrderService (transaction)', () => {
  let service: OrderService;
  let publisher: Partial<OrderPublisher>;
  let client: Partial<CatalogAuthClient>;
  let dataSource: Partial<DataSource>;

  beforeEach(() => {
    // mocks
    publisher = {
      publishOrderCreated: jest.fn().mockResolvedValue(undefined),
    };

    client = {
      getUserSummary: jest.fn().mockResolvedValue({ isActive: true }),
      getProductSnapshot: jest.fn().mockResolvedValue({ isAvailable: true, price: 100, name: 'Test Product' }),
    };

    // minimal transaction mock that executes the callback with a fake manager
    dataSource = {
      transaction: jest.fn(async (cb: any) => {
        const fakeManager = {
          getRepository: (entity: any) => ({
            create: (d: any) => d,
            save: async (d: any) => {
              // simulate DB assigning an id for order
              if (Array.isArray(d)) {
                return d.map((it: any, i: number) => ({ id: `item-${i}`, ...it }));
              }
              return { id: 'order-1', ...d };
            },
          }),
        };
        return cb(fakeManager);
      }),
    };

    // OrderRepository not used for saves in transaction, pass a minimal mock for other calls
    const repoMock = {} as unknown as OrderRepository;

    service = new OrderService(repoMock, publisher as OrderPublisher, client as CatalogAuthClient, dataSource as DataSource);
  });

  it('creates order inside a transaction and publishes event', async () => {
    const dto: any = {
      userId: 'user-1',
      items: [{ productId: 'p-1', quantity: 2 }],
      totalAmount: 200,
      shippingAddress: { street: '123' },
    };

    const result = await service.create(dto);

    expect((dataSource.transaction as jest.Mock).mock.calls.length).toBe(1);
    expect((publisher.publishOrderCreated as jest.Mock).mock.calls.length).toBe(1);
    expect(result.id).toBe('order-1');
    expect(result.items).toBeDefined();
  });
});
