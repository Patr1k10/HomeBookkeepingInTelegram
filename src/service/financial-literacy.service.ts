import { Injectable, Logger } from '@nestjs/common';
import { CompoundInterestData } from '../type/interface';
import { VALIDATION_MESSAGES } from '../constants';

@Injectable()
export class FinancialLiteracyService {
  private readonly logger: Logger = new Logger(FinancialLiteracyService.name);

  async calculateCompoundInterest(data: CompoundInterestData, language: string) {
    const validationResult = await this.validateData(data, language);
    if (typeof validationResult === 'string') {
      return validationResult;
    }
    const totalAmount = await this.calculateCompoundInterestAmount(data);
    return totalAmount;
  }

  private async validateData(data: CompoundInterestData, language: string) {
    const { amountPerMonth, rate, durationInYears } = data;
    const messages = VALIDATION_MESSAGES(language);

    if (amountPerMonth === undefined || isNaN(amountPerMonth)) {
      return messages.amountNaN;
    }

    if (rate === undefined || isNaN(rate)) {
      return messages.rateNaN;
    }

    if (durationInYears === undefined || isNaN(durationInYears)) {
      return messages.durationNaN;
    }

    if (amountPerMonth <= 0) {
      return messages.amountInvalid;
    }

    if (rate <= 0 || rate > 100) {
      return messages.rateInvalid;
    }

    if (durationInYears <= 0) {
      return messages.durationInvalid;
    }

    return data;
  }

  private async calculateCompoundInterestAmount(data: CompoundInterestData): Promise<number> {
    const { amountPerMonth, rate, durationInYears } = data;

    const monthlyRate = rate / 100 / 12;
    const totalMonths = durationInYears * 12;

    const futureValue = amountPerMonth * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    return Math.floor(futureValue);
  }
}
