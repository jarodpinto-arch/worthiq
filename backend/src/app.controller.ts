import { Controller, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Controller('ai')
export class AppController {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  @Post('analyze')
  async analyze(@Body() body: { query: string, context: any }) {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: "You are WorthIQ, an elite financial synthesis AI. You analyze portfolios (like MES futures, brokerage, and cash). Be concise, quantitative, and slightly aggressive in identifying risks.",
        messages: [{ role: "user", content: body.query }],
      });

      const textContent = response.content.find(c => c.type === 'text');
      return { 
        answer: textContent && 'text' in textContent ? textContent.text : "Synthesis failed. Brain offline.",
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return { answer: "Error: Check your Anthropic API Key in the .env file.", timestamp: new Date() };
    }
  }
}
