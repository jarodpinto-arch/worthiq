import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plaid')
@UseGuards(JwtAuthGuard)
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('create-link-token')
  async createLinkToken(
    @Request() req,
    @Body() body?: { platform?: 'web' | 'ios' | 'android' },
  ) {
    const platform = body?.platform ?? 'web';
    return this.plaidService.createLinkToken(req.user.id, platform);
  }

  @Post('exchange-public-token')
  async exchangePublicToken(
    @Body() body: { public_token: string },
    @Request() req,
  ) {
    return this.plaidService.exchangePublicToken(
      body.public_token,
      req.user.id,
    );
  }

  @Get('accounts')
  async getAccounts(@Request() req) {
    return this.plaidService.getAccounts(req.user.id);
  }

  @Get('items')
  async getItems(@Request() req) {
    return this.plaidService.getItems(req.user.id);
  }

  @Delete('items/:id')
  async disconnectItem(@Param('id') id: string, @Request() req) {
    return this.plaidService.disconnectItem(id, req.user.id);
  }

  @Get('investment-transactions')
  async getInvestmentTransactions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start =
      startDate ||
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    return this.plaidService.getInvestmentTransactions(req.user.id, start, end);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start =
      startDate ||
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    return this.plaidService.getTransactions(req.user.id, start, end);
  }
}
