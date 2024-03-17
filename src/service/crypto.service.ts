import axios, { AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ICryptoAsset } from '../type/interface';

export class CryptoService {
  private readonly logger: Logger = new Logger(CryptoService.name);
  constructor(private readonly httpService: HttpService) {}
  private readonly apiUrl = process.env.CRIPTO_API;

  async getCryptoAsset(): Promise<ICryptoAsset[]> {
    try {
      const response: AxiosResponse = await axios.get(this.apiUrl);
      const assets: ICryptoAsset[] = response.data.data.map(
        (item: {
          id: string;
          name: string;
          symbol: string;
          rank: string;
          priceUsd: string;
          changePercent24Hr: string;
        }) => ({
          id: item.id,
          name: item.name,
          symbol: item.symbol,
          rank: item.rank,
          priceUsd: item.priceUsd,
          changePercent24Hr: item.changePercent24Hr,
        }),
      );
      const sortedAssets = assets.sort((a, b) => parseFloat(a.rank) - parseFloat(b.rank));
      return sortedAssets.slice(0, 9);
    } catch (error) {
      this.logger.error(`Failed to fetch data from ${this.apiUrl}`, error.message);
      throw new Error('Failed to fetch data from the API');
    }
  }
}
