import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
} from 'plaid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaidService {
  private plaidClient: PlaidApi;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const configuration = new Configuration({
      basePath:
        PlaidEnvironments[
          this.configService.get<string>('PLAID_ENV') || 'sandbox'
        ],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.configService.get('PLAID_CLIENT_ID'),
          'PLAID-SECRET': this.configService.get('PLAID_SECRET'),
        },
      },
    });
    this.plaidClient = new PlaidApi(configuration);
  }

  /**
   * Creates a Plaid Link token. Web clients omit mobile fields; native clients must pass
   * `android` or `ios` so OAuth and LinkKit receive the correct app identity (see Plaid dashboard).
   */
  async createLinkToken(
    userId: string,
    platform: 'web' | 'ios' | 'android' = 'web',
  ) {
    // Transactions is required for checking/savings/credit (and most banks). Requiring
    // Investments in `products` forces at least one investment account — users with only
    // cash/credit hit "No investment accounts". Investments is optional when supported.
    const request: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: 'WorthIQ',
      products: [Products.Transactions],
      optional_products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    if (platform === 'android') {
      request.android_package_name =
        this.configService.get<string>('PLAID_ANDROID_PACKAGE_NAME') ||
        'io.worthiq.app';
    } else if (platform === 'ios') {
      const redirect = this.configService.get<string>('PLAID_IOS_REDIRECT_URI');
      if (redirect) {
        request.redirect_uri = redirect;
      }
    }

    const response = await this.plaidClient.linkTokenCreate(request);
    return { link_token: response.data.link_token };
  }

  // Exchanges the short-lived public_token from Plaid Link for a persistent access_token
  // and stores it in the database linked to this user
  async exchangePublicToken(publicToken: string, userId: string) {
    const response = await this.plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = response.data;

    // Fetch institution info for a friendly label
    let institution: string | null = null;
    try {
      const itemResponse = await this.plaidClient.itemGet({
        access_token,
      });
      const institutionId = itemResponse.data.item.institution_id;
      if (institutionId) {
        const instResponse = await this.plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institution = instResponse.data.institution.name;
      }
    } catch {
      // Non-fatal: institution label is optional
    }

    const item = await this.prisma.plaidItem.create({
      data: {
        accessToken: access_token,
        itemId: item_id,
        institution,
        userId,
      },
    });

    return { success: true, item };
  }

  // Returns all PlaidItems (linked institutions) for this user
  async getItems(userId: string) {
    const items = await this.prisma.plaidItem.findMany({
      where: { userId },
      select: { id: true, institution: true, itemId: true, createdAt: true },
    });
    return { items };
  }

  // Disconnects a linked institution and removes it from the database
  async disconnectItem(itemId: string, userId: string) {
    const item = await this.prisma.plaidItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item not found');
    if (item.userId !== userId) throw new ForbiddenException();

    try {
      await this.plaidClient.itemRemove({ access_token: item.accessToken });
    } catch {
      // Non-fatal: remove from DB even if Plaid call fails
    }

    await this.prisma.plaidItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  // Returns investment transactions (holdings, options, etc.) for this user
  async getInvestmentTransactions(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    const items = await this.prisma.plaidItem.findMany({ where: { userId } });
    if (items.length === 0)
      return { investmentTransactions: [], securities: [] };

    const allTx: any[] = [];
    const allSecurities: any[] = [];

    for (const item of items) {
      try {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await this.plaidClient.investmentsTransactionsGet({
            access_token: item.accessToken,
            start_date: startDate,
            end_date: endDate,
            options: { offset, count: 500 },
          });

          const {
            investment_transactions,
            securities,
            total_investment_transactions,
          } = response.data;
          allTx.push(
            ...investment_transactions.map((t) => ({
              ...t,
              institution: item.institution,
            })),
          );
          allSecurities.push(...securities);
          offset += investment_transactions.length;
          hasMore = offset < total_investment_transactions;
        }
      } catch (err) {
        // Investment product may not be enabled for this item — non-fatal
        // Plaid SDK errors often contain a helpful response payload. Log it so we can
        // distinguish "product not enabled", bad dates, invalid access token, etc.
        const anyErr = err;
        console.error(
          `[Plaid] Investment tx error for item ${item.id}:`,
          anyErr?.response?.data || anyErr?.message || anyErr,
        );
      }
    }

    // Deduplicate securities by security_id
    const secMap = new Map(allSecurities.map((s) => [s.security_id, s]));

    return {
      investmentTransactions: allTx,
      securities: Array.from(secMap.values()),
    };
  }

  // Returns all transactions across every linked institution for this user
  async getTransactions(userId: string, startDate: string, endDate: string) {
    const items = await this.prisma.plaidItem.findMany({ where: { userId } });

    if (items.length === 0) return { transactions: [] };

    const allTransactions: any[] = [];

    for (const item of items) {
      try {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await this.plaidClient.transactionsGet({
            access_token: item.accessToken,
            start_date: startDate,
            end_date: endDate,
            options: { offset, count: 500 },
          });

          const { transactions, total_transactions } = response.data;
          allTransactions.push(
            ...transactions.map((t) => ({
              ...t,
              institution: item.institution,
            })),
          );
          offset += transactions.length;
          hasMore = offset < total_transactions;
        }
      } catch (err) {
        console.error(
          `[Plaid] Error fetching transactions for item ${item.id}:`,
          err.message,
        );
      }
    }

    return { transactions: allTransactions };
  }

  // Returns all accounts across every linked institution for this user
  async getAccounts(userId: string) {
    const items = await this.prisma.plaidItem.findMany({
      where: { userId },
    });

    if (items.length === 0) {
      return { accounts: [] };
    }

    const allAccounts: any[] = [];

    for (const item of items) {
      try {
        const response = await this.plaidClient.accountsGet({
          access_token: item.accessToken,
        });
        // Tag each account with the institution name for display
        const accountsWithInstitution = response.data.accounts.map((acc) => ({
          ...acc,
          institution: item.institution,
          plaid_item_id: item.id,
        }));
        allAccounts.push(...accountsWithInstitution);
      } catch (err) {
        console.error(
          `[Plaid] Error fetching accounts for item ${item.id}:`,
          err.message,
        );
      }
    }

    return { accounts: allAccounts };
  }
}
