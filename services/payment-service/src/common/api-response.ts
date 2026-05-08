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
