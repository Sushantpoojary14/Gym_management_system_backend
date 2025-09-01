export class ApiResponse<T = any> {
  constructor(
    public message: string,
    public data: T,
    public error: string | null = null,
    public statusCode: number = 200,
    // public timestamp: string = new Date().toISOString(),
  ) {}
}
