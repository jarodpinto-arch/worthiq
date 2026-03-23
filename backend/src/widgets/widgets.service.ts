import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WidgetsService {
  constructor(private prisma: PrismaService) {}

  async getWidgets(userId: string) {
    const widgets = await this.prisma.dashboardWidget.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });
    return { widgets };
  }

  async createWidget(userId: string, dto: { type: string; title: string; config: any; position?: number }) {
    const count = await this.prisma.dashboardWidget.count({ where: { userId } });
    const widget = await this.prisma.dashboardWidget.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        config: dto.config,
        position: dto.position ?? count,
      },
    });
    return { widget };
  }

  async updateWidget(id: string, userId: string, dto: { type?: string; title?: string; config?: any }) {
    const widget = await this.prisma.dashboardWidget.findUnique({ where: { id } });
    if (!widget) throw new NotFoundException('Widget not found');
    if (widget.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.dashboardWidget.update({
      where: { id },
      data: {
        ...(dto.type   !== undefined && { type: dto.type }),
        ...(dto.title  !== undefined && { title: dto.title }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });
    return { widget: updated };
  }

  async deleteWidget(id: string, userId: string) {
    const widget = await this.prisma.dashboardWidget.findUnique({ where: { id } });
    if (!widget) throw new NotFoundException('Widget not found');
    if (widget.userId !== userId) throw new ForbiddenException();

    await this.prisma.dashboardWidget.delete({ where: { id } });
    return { success: true };
  }

  async reorderWidgets(userId: string, order: { id: string; position: number }[]) {
    await Promise.all(
      order.map(({ id, position }) =>
        this.prisma.dashboardWidget.updateMany({
          where: { id, userId },
          data: { position },
        }),
      ),
    );
    return { success: true };
  }
}
