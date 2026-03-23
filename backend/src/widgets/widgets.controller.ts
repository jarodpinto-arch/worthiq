import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('widgets')
@UseGuards(JwtAuthGuard)
export class WidgetsController {
  constructor(private widgetsService: WidgetsService) {}

  @Get()
  async getWidgets(@Request() req) {
    return this.widgetsService.getWidgets(req.user.id);
  }

  @Post()
  async createWidget(
    @Body() body: { type: string; title: string; config: any; position?: number },
    @Request() req,
  ) {
    return this.widgetsService.createWidget(req.user.id, body);
  }

  @Put(':id')
  async updateWidget(
    @Param('id') id: string,
    @Body() body: { type?: string; title?: string; config?: any },
    @Request() req,
  ) {
    return this.widgetsService.updateWidget(id, req.user.id, body);
  }

  @Delete(':id')
  async deleteWidget(@Param('id') id: string, @Request() req) {
    return this.widgetsService.deleteWidget(id, req.user.id);
  }

  @Patch('reorder')
  async reorderWidgets(
    @Body() body: { order: { id: string; position: number }[] },
    @Request() req,
  ) {
    return this.widgetsService.reorderWidgets(req.user.id, body.order);
  }
}
