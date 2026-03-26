import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SageService } from './sage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sage')
@UseGuards(JwtAuthGuard)
export class SageController {
  constructor(private sageService: SageService) {}

  @Post('classify')
  async classify(@Body() body: { transactions: any[] }, @Request() req) {
    return this.sageService.classifyTransactions(
      req.user.id,
      body.transactions,
    );
  }

  @Get('classifications')
  async getClassifications(@Request() req) {
    return this.sageService.getClassifications(req.user.id);
  }

  @Patch('classifications/:transactionId')
  async setUserCategory(
    @Param('transactionId') transactionId: string,
    @Body() body: { category: string },
    @Request() req,
  ) {
    return this.sageService.setUserCategory(
      req.user.id,
      transactionId,
      body.category,
    );
  }

  @Post('chat')
  async chat(@Body() body: { message: string; context: any }, @Request() req) {
    return this.sageService.chat(req.user.id, body.message, body.context);
  }

  @Get('chat')
  async getChatHistory(@Request() req) {
    return this.sageService.getChatHistory(req.user.id);
  }

  @Delete('chat')
  async clearChat(@Request() req) {
    return this.sageService.clearChat(req.user.id);
  }

  @Post('create-widget')
  async createWidget(
    @Body() body: { prompt: string; context: any },
    @Request() req,
  ) {
    return this.sageService.createWidget(
      req.user.id,
      body.prompt,
      body.context,
    );
  }
}
