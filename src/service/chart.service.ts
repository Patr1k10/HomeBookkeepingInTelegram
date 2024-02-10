import { Injectable, Logger } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { Transaction } from '../interface';
import { toNormalDate } from '../common';
import { DATA_FOR, DATA_PERIOD } from '../constants';
import { ITransactionQuery } from '../interface/transaction.query.interface';

@Injectable()
export class ChartService {
  private readonly logger: Logger = new Logger(ChartService.name);

  async generateTransactionChart(transactions: { amount: number; transactionName: string }[]): Promise<string> {
    const labels = transactions.map((transaction) => transaction.transactionName);
    const amounts = transactions.map((transaction) => transaction.amount);

    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    const maxAmount = Math.max(...amounts);
    const maxY = Math.ceil(maxAmount / 100) * 100;

    const columnWidth = 40;
    const gap = 20;
    const totalColumns = labels.length;
    const totalWidth = (columnWidth + gap) * totalColumns;
    const startX = (canvas.width - totalWidth) / 2;

    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    for (let i = 1; i <= 5; i++) {
      const y = canvas.height - 50 - ((canvas.height - 100) / 5) * i;
      ctx.moveTo(startX, y);
      ctx.lineTo(canvas.width - startX, y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < totalColumns; i++) {
      const x = startX + i * (columnWidth + gap) + columnWidth / 2;
      ctx.moveTo(x, canvas.height - 50);
      ctx.lineTo(x, 0);
    }
    ctx.stroke();

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(startX, canvas.height - 50);
    ctx.lineTo(canvas.width - startX, canvas.height - 50);
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, canvas.height - 50);
    ctx.stroke();

    ctx.font = '14px Arial';
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - 50 - ((canvas.height - 100) / 5) * i;
      ctx.fillText(String((maxY / 5) * i), startX - 30, y);
    }

    for (let i = 0; i < totalColumns; i++) {
      const x = startX + i * (columnWidth + gap);
      const y = canvas.height - 50 - (amounts[i] / maxY) * (canvas.height - 100);
      ctx.fillStyle = 'blue';
      ctx.fillRect(x, y, columnWidth, (amounts[i] / maxY) * (canvas.height - 100));
      ctx.fillStyle = 'black';
      ctx.fillText(labels[i], x, canvas.height - 30);
    }

    const imageDataUrl = canvas.toDataURL();
    return imageDataUrl.replace(/^data:image\/png;base64,/, '');
  }

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
      const textX = centerX + (radius / 1.1) * Math.cos(midAngle);
      const textY = centerY + (radius / 1.1) * Math.sin(midAngle);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${transactionName}(${amount}.грн) ${Math.round(percentageChart * 100)}%`, textX, textY);

      startAngle = endAngle;
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
