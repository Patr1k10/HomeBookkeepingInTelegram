import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ICurrencyRates } from '../interface';

@Injectable()
export class CurrencyService {
  private readonly logger: Logger = new Logger(CurrencyService.name);

  async getCurrencyData() {
    try {
      this.logger.log('getCurrencyData');
      const url = process.env.CURRENT_URL;
      const response = await axios.get(url);
      const result = this.parseCurrencyRates(response.data);
      // this.logger.log(result);
      return result;
    } catch (err) {
      this.logger.error('invalid response.data', err);
    }
  }

  private async parseCurrencyRates(html: string): Promise<ICurrencyRates[]> {
    const $ = cheerio.load(html);
    const currencyRates: ICurrencyRates[] = [];

    const headers: string[] = [];
    $('table.summary-rates.full-rates thead th').each((index, element) => {
      headers.push($(element).text().trim().toLowerCase());
    });

    $('table.summary-rates.full-rates tbody tr').each((index, element) => {
      const rowData: any = {};
      $(element)
        .find('td')
        .each((tdIndex, tdElement) => {
          const header = headers[tdIndex];
          rowData[header] = $(tdElement).text().trim();
        });

      const currencyRate: ICurrencyRates = {
        currencyCode: rowData['код'],
        currencyName: rowData['валюта'],
        buyRate: rowData['купівля'],
        sellRate: rowData['продаж'],
      };

      currencyRates.push(currencyRate);
    });

    return currencyRates;
  }
}
