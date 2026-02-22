import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plaid')
@UseGuards(JwtAuthGuard)
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('create-link-token')
  async createLinkToken(@Request() req) {
    return this.plaidService.createLinkToken(req.user.id);
  }

  @Post('exchange-public-token')
  async exchangePublicToken(
    @Body() body: { publicToken: string },
    @Request() req,
  ) {
    return this.plaidService.exchangePublicToken(body.publicToken, req.user.id);
  }

  @Get('accounts')
  async getAccounts(@Request() req) {
    return this.plaidService.getAccountsForUser(req.user.id);
  }

  @Post('sync-accounts')
  async syncAccounts(@Request() req) {
    return this.plaidService.syncAccounts(req.user.id);
  }

  @Post('fetch-transactions')
  async fetchTransactions(
    @Body() body: { startDate: string; endDate: string },
    @Request() req,
  ) {
    return this.plaidService.fetchTransactions(
      req.user.id,
      body.startDate,
      body.endDate,
    );
  }

  @Get('transactions')
  async getTransactions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    return this.plaidService.getTransactionsForUser(req.user.id, startDate, endDate);
  }
}