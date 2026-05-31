# Step 3 - Controller and Repository Standardization

This step defines a reusable pattern for NestJS microservices in this project.

## 1) Layering contract

Use this structure for each feature module:

- Controller layer: input validation, HTTP concerns, response envelope
- Service/UseCase layer: business rules and orchestration
- Repository layer: persistence operations only

Flow:

`Controller -> Service/UseCase -> Repository -> TypeORM`

## 2) Standard response envelope

Use `ApiResponse<T>` in controllers for consistency:

```ts
export class ApiResponse<T> {
  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly data: T,
  ) {}

  static success<T>(data: T, message = 'Success', code = 200): ApiResponse<T> {
    return new ApiResponse(code, message, data);
  }
}
```

Implemented in:

- `services/order-service/src/common/api-response.ts`
- `services/product-service/src/common/api-response.ts`

## 3) Controller template (standard)

```ts
@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  async create(@Body() dto: CreateResourceDto): Promise<ApiResponse<Resource>> {
    const created = await this.resourceService.create(dto);
    return ApiResponse.success(created, 'Resource created', 201);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<Resource>> {
    const data = await this.resourceService.findOne(id);
    return ApiResponse.success(data);
  }
}
```

## 4) Repository contract template (standard)

```ts
export interface IResourceRepository {
  create(data: Partial<Resource>): Resource;
  save(entity: Resource): Promise<Resource>;
  findById(id: string): Promise<Resource | null>;
  deleteById(id: string): Promise<boolean>;
}
```

Implementation with TypeORM:

```ts
@Injectable()
export class ResourceRepository implements IResourceRepository {
  constructor(
    @InjectRepository(Resource)
    private readonly ormRepo: Repository<Resource>,
  ) {}

  create(data: Partial<Resource>): Resource {
    return this.ormRepo.create(data);
  }

  save(entity: Resource): Promise<Resource> {
    return this.ormRepo.save(entity);
  }

  findById(id: string): Promise<Resource | null> {
    return this.ormRepo.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.ormRepo.delete(id);
    return !!result.affected;
  }
}
```

## 5) Applied in this repository

Order service now follows standardized controller/repository style:

- `services/order-service/src/order/order.controller.ts`
- `services/order-service/src/order/dto/query-orders.dto.ts`
- `services/order-service/src/order/repositories/order.repository.contract.ts`
- `services/order-service/src/order/repositories/order.repository.ts`

Product service already uses a repository layer and `ApiResponse` envelope:

- `services/product-service/src/product/product.controller.ts`
- `services/product-service/src/product/product.service.ts`
- `services/product-service/src/product/repositories/product.repository.ts`
- `services/product-service/src/product/repositories/category.repository.ts`

## 6) Migration checklist for remaining services

- Add `ApiResponse<T>` in each service `src/common/`
- Replace `any` request query with typed DTOs
- Use `ParseUUIDPipe` for path UUIDs
- Move all DB calls into repository classes
- Keep business rules in service/usecase classes only
- Keep controller methods thin and response-focused
