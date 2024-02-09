import { Injectable, Logger } from '@nestjs/common';
import { createCanvas } from 'canvas';

@Injectable()
export class ChartService {
  private readonly logger: Logger = new Logger(ChartService.name);

  async generateTransactionChart(transactions: { amount: number; transactionName: string }[]): Promise<string> {
    const labels = transactions.map((transaction) => transaction.transactionName);
    const amounts = transactions.map((transaction) => transaction.amount);

    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    const maxAmount = Math.max(...amounts);
    const maxY = Math.ceil(maxAmount / 100) * 100;

    const columnWidth = 40;
    const gap = 20;
    const totalColumns = labels.length;
    const totalWidth = (columnWidth + gap) * totalColumns;
    const startX = (canvas.width - totalWidth) / 2;

    // Отрисовываем сетку по оси Y
    ctx.strokeStyle = '#ddd'; // Цвет сетки
    ctx.beginPath();
    for (let i = 1; i <= 5; i++) {
      const y = canvas.height - 50 - ((canvas.height - 100) / 5) * i;
      ctx.moveTo(startX, y);
      ctx.lineTo(canvas.width - startX, y);
    }
    ctx.stroke();

    // Отрисовываем сетку по оси X
    ctx.beginPath();
    for (let i = 0; i < totalColumns; i++) {
      const x = startX + i * (columnWidth + gap) + columnWidth / 2;
      ctx.moveTo(x, canvas.height - 50);
      ctx.lineTo(x, 0);
    }
    ctx.stroke();

    // Отрисовываем оси координат
    ctx.strokeStyle = 'black'; // Возвращаем цвет обводки к черному для осей
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
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');

    return base64Data;
  }
}
