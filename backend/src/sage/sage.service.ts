import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SageService {
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // ── Classification ────────────────────────────────────────────────────────

  async classifyTransactions(userId: string, transactions: any[]) {
    if (transactions.length === 0) return { classifications: {} };

    const existing = await this.prisma.transactionClassification.findMany({
      where: {
        userId,
        transactionId: { in: transactions.map((t) => t.transaction_id) },
      },
    });

    const existingIds = new Set(existing.map((e) => e.transactionId));
    const toClassify = transactions.filter(
      (t) => !existingIds.has(t.transaction_id),
    );

    if (toClassify.length > 0) {
      const BATCH = 50;
      const batches: any[][] = [];
      for (let i = 0; i < toClassify.length; i += BATCH) {
        batches.push(toClassify.slice(i, i + BATCH));
      }
      // Run all batches in parallel — dramatically faster for large transaction sets
      await Promise.allSettled(
        batches.map((batch) => this.classifyBatch(userId, batch)),
      );
    }

    const all = await this.prisma.transactionClassification.findMany({
      where: {
        userId,
        transactionId: { in: transactions.map((t) => t.transaction_id) },
      },
    });

    const map: Record<string, any> = {};
    all.forEach((c) => {
      map[c.transactionId] = c;
    });
    return { classifications: map };
  }

  private async classifyBatch(userId: string, transactions: any[]) {
    const list = transactions.map((t) => ({
      id: t.transaction_id,
      name: t.name,
      merchant: t.merchant_name ?? null,
      amount: t.amount,
      plaid_category: t.category?.[0] ?? null,
    }));

    const prompt = `Classify these personal finance transactions into specific, meaningful categories.

Use precise categories such as: Groceries, Dining Out, Fast Food, Coffee & Cafes, Gas & Fuel, Streaming Services, Subscriptions, Online Shopping, Clothing, Electronics, Utilities, Rent / Mortgage, Healthcare, Pharmacy, Gym & Fitness, Entertainment, Travel - Flights, Travel - Hotels, Rideshare, Parking, ATM & Cash, Bank Transfer, Investment Purchase, Options Trade, Salary / Income, Freelance Income, Pet Care, Education, Home & Garden, Personal Care.

Respond ONLY with valid JSON, no explanation or markdown:
{"results": [{"id": "transaction_id", "category": "Category Name"}]}

Transactions:
${JSON.stringify(list)}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content.find((c) => c.type === 'text');
      if (!block || !('text' in block)) return;

      // Strip any markdown code fences Claude might add
      const raw = block.text
        .trim()
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
      const parsed = JSON.parse(raw);
      const results: { id: string; category: string }[] = parsed.results ?? [];

      await Promise.all(
        results.map(({ id, category }) =>
          this.prisma.transactionClassification.upsert({
            where: { transactionId_userId: { transactionId: id, userId } },
            create: { transactionId: id, userId, aiCategory: category },
            update: { aiCategory: category },
          }),
        ),
      );
    } catch (err) {
      console.error('[Sage] classify error:', err.message);
    }
  }

  async getClassifications(userId: string) {
    const all = await this.prisma.transactionClassification.findMany({
      where: { userId },
    });
    const map: Record<string, any> = {};
    all.forEach((c) => {
      map[c.transactionId] = c;
    });
    return { classifications: map };
  }

  async setUserCategory(
    userId: string,
    transactionId: string,
    category: string,
  ) {
    return this.prisma.transactionClassification.upsert({
      where: { transactionId_userId: { transactionId, userId } },
      create: { transactionId, userId, userCategory: category },
      update: { userCategory: category },
    });
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  async chat(userId: string, message: string, context: any) {
    const history = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const system = `You are Sage — WorthIQ's personal financial intelligence AI. You have real-time access to the user's complete financial picture. You speak with precision, clarity, and quiet confidence. You surface patterns and risks others miss.

LIVE FINANCIAL CONTEXT:
${JSON.stringify(context, null, 2)}

Rules:
- Reference specific numbers from the context when relevant
- Be concise but insightful — no filler
- Flag risks proactively
- For investments and options: be analytical, note this is information not financial advice
- Keep responses under 200 words unless depth is explicitly requested`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system,
        messages,
      });

      const block = response.content.find((c) => c.type === 'text');
      const reply =
        block && 'text' in block ? block.text : 'Signal lost. Try again.';

      await this.prisma.chatMessage.createMany({
        data: [
          { userId, role: 'user', content: message },
          { userId, role: 'assistant', content: reply },
        ],
      });

      return { reply };
    } catch (err) {
      console.error('[Sage] chat error:', err.message);
      throw err;
    }
  }

  async getChatHistory(userId: string) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async clearChat(userId: string) {
    await this.prisma.chatMessage.deleteMany({ where: { userId } });
    return { success: true };
  }

  // ── Widget Creation ────────────────────────────────────────────────────────

  async createWidget(userId: string, prompt: string, context: any) {
    const system = `You are Sage — WorthIQ's financial AI. Your task is to interpret a user's natural language request and produce a dashboard widget configuration JSON.

Widget types available:
- metric: single number (total_spent, total_income, net_worth, total_cash, total_credit, total_investments, count, pl_total, avg_amount)
- bar: bar chart
- line: line chart over time
- pie: donut chart
- table: sortable rows

Data sources:
- transactions: spending/income data
- investment_transactions: trades, options, buys/sells
- accounts: balances by account type

groupBy options (for charts/tables): category, merchant, ticker, month, week, account, institution, type, subtype

Filters:
- txFilter: { category, merchant, type (debit/credit), dateRange (30d/90d/6mo/1yr) }
- invFilter: { subtype (buy/sell/option/dividend), ticker }
- accountFilter: { type (depository/credit/investment) }

LIVE FINANCIAL CONTEXT:
${JSON.stringify(context, null, 2)}

Return ONLY a valid JSON object with this exact structure, no explanation or markdown:
{
  "title": "Widget Title",
  "type": "metric|bar|line|pie|table",
  "config": {
    "dataSource": "transactions|investment_transactions|accounts",
    "metric": "...",
    "groupBy": "...",
    "txFilter": {},
    "invFilter": {},
    "accountFilter": {},
    "dateRange": "30d|90d|6mo|1yr",
    "limit": 10
  }
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content.find((c) => c.type === 'text');
      if (!block || !('text' in block))
        throw new Error('No response from Sage');

      const raw = block.text
        .trim()
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
      const parsed = JSON.parse(raw);
      return { widget: parsed };
    } catch (err) {
      console.error('[Sage] createWidget error:', err.message);
      throw err;
    }
  }
}
