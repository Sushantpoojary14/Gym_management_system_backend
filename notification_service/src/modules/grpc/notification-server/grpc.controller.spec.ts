import { Test, TestingModule } from '@nestjs/testing';
import { GrpcController } from './grpc.controller';

describe('GrpcController', () => {
  let controller: GrpcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcController],
    }).compile();

    controller = module.get<GrpcController>(GrpcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
