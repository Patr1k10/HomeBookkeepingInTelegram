import { Injectable, Logger } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { Transaction } from '../type/interface';
import { toNormalDate } from '../common';
import { DATA_FOR, DATA_PERIOD } from '../constants';
import { ITransactionQuery } from '../type/interface/transaction.query.interface';

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

  async generateDailyTransactionChart(transactions: Transaction[]): Promise<string> {
    try {
      this.logger.log(`Starting to generate chart. Received ${transactions.length} transactions`);

      if (!transactions || transactions.length === 0) {
        this.logger.warn('No transactions provided for chart generation');
        throw new Error('No transactions provided');
      }

      const width = 1280;
      const height = 720;
      const padding = 60;

      this.logger.log('Creating canvas');
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const chartWidth = width - 2 * padding;
      const chartHeight = height - 2 * padding;

      // Group transactions by date and calculate daily totals
      this.logger.log('Grouping transactions by date');
      const dailyTotals = new Map<string, { positive: number; negative: number }>();

      transactions.forEach((transaction) => {
        const date = new Date(transaction.timestamp).toISOString().split('T')[0];
        const current = dailyTotals.get(date) || { positive: 0, negative: 0 };

        if (transaction.amount >= 0) {
          current.positive += transaction.amount;
        } else {
          current.negative += transaction.amount;
        }

        dailyTotals.set(date, current);
      });

      this.logger.log(`Grouped into ${dailyTotals.size} daily entries`);

      const dates = Array.from(dailyTotals.keys()).sort();

      // Find min and max values for scaling
      let minTotal = 0;
      let maxTotal = 0;
      const positiveData: number[] = [];
      const negativeData: number[] = [];

      dates.forEach((date) => {
        const { positive, negative } = dailyTotals.get(date)!;
        positiveData.push(positive);
        negativeData.push(negative);
        minTotal = Math.min(minTotal, negative);
        maxTotal = Math.max(maxTotal, positive);
      });

      this.logger.log(`Value range: min=${minTotal}, max=${maxTotal}`);

      // Add some padding to min/max values
      const valueRange = maxTotal - minTotal;
      minTotal -= valueRange * 0.1;
      maxTotal += valueRange * 0.1;

      try {
        // Clear background
        this.logger.log('Drawing background');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw title
        this.logger.log('Drawing title');
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Daily Transaction Summary for ${transactions[0].transactionName}`, width / 2, padding / 2);

        // Draw axes
        this.logger.log('Drawing axes');
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Y-axis labels
        this.logger.log('Drawing Y-axis labels');
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';

        const ySteps = 10;
        for (let i = 0; i <= ySteps; i++) {
          const value = minTotal + (maxTotal - minTotal) * (i / ySteps);
          const y = height - padding - (height - 2 * padding) * (i / ySteps);
          ctx.fillText(value.toLocaleString('uk-UA'), padding - 10, y + 4);
        }

        // X-axis labels
        this.logger.log('Drawing X-axis labels');
        ctx.textAlign = 'center';
        const step = Math.ceil(dates.length / 10); // Show maximum 10 date labels
        dates.forEach((date, i) => {
          if (i % step === 0) {
            const x = padding + (width - 2 * padding) * (i / (dates.length - 1));
            ctx.save();
            ctx.translate(x, height - padding + 20);
            ctx.rotate(Math.PI / 4);
            ctx.fillText(new Date(date).toLocaleDateString('uk-UA'), 0, 0);
            ctx.restore();
          }
        });

        // Draw grid
        this.logger.log('Drawing grid');
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;

        for (let i = 0; i <= ySteps; i++) {
          const y = padding + chartHeight * (i / ySteps);
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(padding + chartWidth, y);
          ctx.stroke();
        }

        // Draw data lines
        this.logger.log('Starting to draw data lines');
        const drawLine = (data: number[], color: string, label: string) => {
          this.logger.log(`Drawing ${label} line with ${data.length} points`);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();

          data.forEach((value, i) => {
            const x = padding + chartWidth * (i / (dates.length - 1));
            const y = padding + chartHeight - chartHeight * ((value - minTotal) / (maxTotal - minTotal));

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.stroke();

          // Draw points
          data.forEach((value, i) => {
            const x = padding + chartWidth * (i / (dates.length - 1));
            const y = padding + chartHeight - chartHeight * ((value - minTotal) / (maxTotal - minTotal));

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          });
        };

        // Draw both lines
        drawLine(positiveData, '#198754', 'positive'); // Green for positive
        drawLine(negativeData, '#dc3545', 'negative'); // Red for negative

        // Draw legend
        this.logger.log('Drawing legend');
        const legendY = padding / 2;
        ctx.font = '14px Arial';

        // Positive transactions
        ctx.fillStyle = '#198754';
        ctx.fillRect(width - padding - 200, legendY - 8, 16, 16);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('Income', width - padding - 175, legendY + 4);

        // Negative transactions
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(width - padding - 100, legendY - 8, 16, 16);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('Expenses', width - padding - 75, legendY + 4);

        this.logger.log('Converting canvas to base64');
        const imageData = canvas.toDataURL();
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

        this.logger.log('Chart generation completed successfully');
        return base64Data;
      } catch (drawError) {
        this.logger.error('Error during drawing operations', drawError);
        throw drawError;
      }
    } catch (error) {
      this.logger.error('Error generating chart', error);
      throw error;
    }
  }
}
