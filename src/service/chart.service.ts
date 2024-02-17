import { Injectable, Logger } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { Transaction } from '../interface';
import { toNormalDate } from '../common';
import { DATA_FOR, DATA_PERIOD } from '../constants';
import { ITransactionQuery } from '../interface/transaction.query.interface';

@Injectable()
export class ChartService {
  private readonly logger: Logger = new Logger(ChartService.name);

  async generateCustomChart(
    transactions: Transaction[],
    transactionQuery: ITransactionQuery,
    language: string,
  ): Promise<string> {
    const width = 1280;
    const height = 720;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const timestamp = transactionQuery.timestamp;
    let chartTitle = ``;
    if (timestamp !== undefined) {
      if (timestamp.$lte !== undefined) {
        const startDate = await toNormalDate(timestamp.$gte);
        const endDate = await toNormalDate(timestamp.$lte);
        chartTitle = `${DATA_PERIOD(startDate, endDate, language || 'ua')}`;
      } else {
        const startDate = await toNormalDate(timestamp.$gte);
        chartTitle = `${DATA_FOR[language || 'ua']} ${startDate}\n`;
      }
    }

    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartTitle, width / 2, 30);

    const mergedTransactionsMap = new Map<string, number>();

    for (const transaction of transactions) {
      const { transactionName, amount } = transaction;
      const existingAmount = mergedTransactionsMap.get(transactionName) || 0;
      mergedTransactionsMap.set(transactionName, existingAmount + amount);
    }

    const mergedTransactions = Array.from(mergedTransactionsMap.entries()).map(([transactionName, amount]) => ({
      transactionName,
      amount,
    }));

    const positiveTransactions = mergedTransactions.filter((transaction) => transaction.amount > 0);
    const negativeTransactions = mergedTransactions.filter((transaction) => transaction.amount < 0);

    const totalPositiveValue = positiveTransactions.reduce((sum, { amount }) => sum + amount, 0);
    const totalNegativeValue = Math.abs(negativeTransactions.reduce((sum, { amount }) => sum + amount, 0));

    const radius = Math.min(width, height) * 0.4;
    const centerY = height / 2;

    let startAngle = -Math.PI / 2;
    let centerX = width / 4.2;

    await this.drawTransactions(ctx, positiveTransactions, totalPositiveValue, startAngle, centerX, centerY, radius);

    startAngle = -Math.PI / 2;
    centerX = (width * 2.3) / 3;

    await this.drawTransactions(ctx, negativeTransactions, totalNegativeValue, startAngle, centerX, centerY, radius);
    const imageDataUrl = canvas.toDataURL();
    return imageDataUrl.replace(/^data:image\/png;base64,/, '');
  }

  async drawTransactions(
    ctx: any,
    transactions: { transactionName: string; amount: number }[],
    totalValue: number,
    startAngle: number,
    centerX: number,
    centerY: number,
    radius: number,
  ): Promise<void> {
    const totalAmount = transactions.reduce((sum, { amount }) => sum + amount, 0);
    const textPadding = 20;

    for (const { transactionName, amount } of transactions) {
      const percentageChart = Math.abs(amount) / totalValue;
      const endAngle = startAngle + percentageChart * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = await this.getRandomColor();
      ctx.fill();

      const midAngle = (startAngle + endAngle) / 2;

      const textX = centerX + (radius + textPadding) * Math.cos(midAngle);
      const textY = centerY + (radius + textPadding) * Math.sin(midAngle);

      ctx.translate(textX, textY);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${transactionName}(${amount}.грн) ${Math.round(percentageChart * 100)}%`, 0, 0);
      ctx.translate(-textX, -textY);

      startAngle = endAngle;

      const textUnderTable = `Total: ${totalAmount}`;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(textUnderTable, centerX, centerY + radius + 40);

      const textUpTable = totalAmount >= 0 ? 'Positive transactions:' : 'Negative transactions:';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(textUpTable, centerX, centerY - radius - 40);
    }
  }
  private async getRandomColor(): Promise<string> {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
