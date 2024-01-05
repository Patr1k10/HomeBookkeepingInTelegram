import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ICurrencyRates } from '../interface';
@Injectable()
export class CurrencyService {
  private readonly logger: Logger = new Logger(CurrencyService.name);

  async getData() {
    const url = 'https://rate.in.ua/kiev';
    const response = await axios.get(url);
    const currencyRates = this.parseCurrencyRates(response.data);
    this.logger.log(currencyRates);
    return currencyRates;
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
