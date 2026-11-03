import { Module } from '@nestjs/common';
import { ClassroomsController } from './classrooms.controller.js';
import { ClassroomsService } from './classrooms.service.js';
import { PromotionController } from '../promotion/promotion.controller.js';
import { PromotionService } from '../promotion/promotion.service.js';

@Module({
  controllers: [ClassroomsController, PromotionController],
  providers: [ClassroomsService, PromotionService],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}