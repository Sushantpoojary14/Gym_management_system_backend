import { HttpStatus } from "@nestjs/common";

export class CustomHttpResponse<T> {
    constructor(
      private readonly data: T ,
      private readonly message: string = 'Success',
      private readonly status: HttpStatus = HttpStatus.OK,
    ) {}
  
    toJSON() {
      return {
        message: this.message,
        data: this.data,
        status: this.status,
      };
    }
  }