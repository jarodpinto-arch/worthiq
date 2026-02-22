import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaidService {
  private plaidClient: PlaidApi;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const clientId = this.configService.get('PLAID_CLIENT_ID');
    const secret = this.configService.get('PLAID_SECRET');

    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found. Please log in first.');
    }

    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Financial Dashboard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    try {
      const response = await this.plaidClient.linkTokenCreate(request);
      return response.data;
    } catch (error) {
      console.error('Plaid API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async exchangePublicToken(publicToken: string, userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found. Please log in first.');
      }

      const exchangeResponse = await this.plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      const itemResponse = await this.plaidClient.itemGet({
        access_token: accessToken,
      });

      const institutionId = itemResponse.data.item.institution_id;
      let institutionName = 'Unknown Bank';

      if (institutionId) {
        const institutionResponse = await this.plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = institutionResponse.data.institution.name;
      }

      const item = await this.prisma.item.create({
        data: {
          userId: userId,
          plaidItemId: itemId,
          plaidAccessToken: accessToken,
          institutionId: institutionId,
          institutionName: institutionName,
        },
      });

      const accountsResponse = await this.plaidClient.accountsGet({
        access_token: accessToken,
      });

      const accounts = await Promise.all(
        accountsResponse.data.accounts.map((account) =>
          this.prisma.account.create({
            data: {
              itemId: item.id,
              plaidAccountId: account.account_id,
              name: account.name,
              officialName: account.official_name,
              type: account.type,
              subtype: account.subtype,
              mask: account.mask,
              currentBalance: account.balances.current,
              availableBalance: account.balances.available,
              isoCurrencyCode: account.balances.iso_currency_code,
            },
          })
        )
      );

      console.log(`✅ Saved ${accounts.length} accounts to database`);

      return {
        item,
        accounts,
      };
    } catch (error) {
      console.error('Exchange Token Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAccountsForUser(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        item: {
          userId: userId,
          status: 'active',
        },
      },
      include: {
        item: {
          select: {
            institutionName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return accounts;
  }

  async syncAccounts(userId: string) {
    const items = await this.prisma.item.findMany({
      where: {
        userId: userId,
        status: 'active',
      },
    });

    for (const item of items) {
      try {
        const accountsResponse = await this.plaidClient.accountsGet({
          access_token: item.plaidAccessToken,
        });

        for (const account of accountsResponse.data.accounts) {
          await this.prisma.account.update({
            where: {
              plaidAccountId: account.account_id,
            },
            data: {
              currentBalance: account.balances.current,
              availableBalance: account.balances.available,
            },
          });
        }

        console.log(`✅ Synced accounts for item ${item.institutionName}`);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error.message);
      }
    }

    return this.getAccountsForUser(userId);
  }

  async fetchTransactions(userId: string, startDate: string, endDate: string) {
    const items = await this.prisma.item.findMany({
      where: {
        userId: userId,
        status: 'active',
      },
    });

    let allTransactions: any[] = [];

    for (const item of items) {
      try {
        const transactionsResponse = await this.plaidClient.transactionsGet({
          access_token: item.plaidAccessToken,
          start_date: startDate,
          end_date: endDate,
        });

        const transactions = transactionsResponse.data.transactions;

        for (const transaction of transactions) {
          const account = await this.prisma.account.findUnique({
            where: {
              plaidAccountId: transaction.account_id,
            },
          });

          if (account) {
            await this.prisma.transaction.upsert({
              where: {
                plaidTransactionId: transaction.transaction_id,
              },
              update: {
                amount: transaction.amount,
                date: new Date(transaction.date),
                name: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                pending: transaction.pending,
                paymentChannel: transaction.payment_channel,
              },
              create: {
                itemId: item.id,
                accountId: account.id,
                plaidTransactionId: transaction.transaction_id,
                amount: transaction.amount,
                date: new Date(transaction.date),
                name: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                pending: transaction.pending,
                paymentChannel: transaction.payment_channel,
              },
            });
          }
        }

        allTransactions.push(...transactions);
        console.log(`✅ Saved ${transactions.length} transactions from ${item.institutionName}`);
      } catch (error) {
        console.error(`Error fetching transactions for item ${item.id}:`, error.message);
      }
    }

    return this.getTransactionsForUser(userId, startDate, endDate);
  }

  async getTransactionsForUser(userId: string, startDate?: string, endDate?: string) {
    const where: any = {
      item: {
        userId: userId,
        status: 'active',
      },
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            name: true,
            mask: true,
          },
        },
        item: {
          select: {
            institutionName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return transactions;
  }
}