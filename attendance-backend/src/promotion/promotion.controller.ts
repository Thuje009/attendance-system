import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { PromotionService, type PromotionInput } from './promotion.service.js';

@Controller('promotion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PromotionController {
  constructor(private readonly promotion: PromotionService) {}

  @Post('preview')
  preview(@Body() body: PromotionInput) {
    return this.promotion.preview(body);
  }

  @Post('apply')
  apply(@Body() body: PromotionInput) {
    return this.promotion.apply(body);
  }

  @Delete(':year')
  undo(@Param('year') year: string) {
    return this.promotion.undo(Number(year));
  }
}