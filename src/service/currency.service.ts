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
      return this.parseCurrencyRates(response.data);
    } catch (err) {
      this.logger.error('invalid response.data', err);
    }
  }

  private parseCurrencyRates(html: string) {
    const $ = cheerio.load(html);
    const currencyRates: ICurrencyRates[] = [];

    $('table.summary-rates.full-rates tbody tr').each((index, element) => {
      const currencyCode = $(element).find('td:nth-child(2)').text().trim();
      const currencyName = $(element).find('td:nth-child(3)').text().trim();
      const buyRate = $(element).find('td:nth-child(4)').text().trim();
      const sellRate = $(element).find('td:nth-child(5)').text().trim();

      currencyRates.push({ currencyCode, currencyName, buyRate, sellRate });
    });

    return currencyRates;
  }
}
