import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should report healthy status', () => {
      const result = appController.health();
      expect(result.code).toBe(200);
      expect(result.data).toEqual({ status: 'ok', service: 'cart-service' });
    });
  });
});
