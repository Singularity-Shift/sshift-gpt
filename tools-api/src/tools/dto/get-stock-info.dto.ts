import { IFinancial } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';
import { QuoteSummaryResult } from 'yahoo-finance2/dist/esm/src/modules/quoteSummary-iface';
import { RecommendationsBySymbolResponse } from 'yahoo-finance2/dist/esm/src/modules/recommendationsBySymbol';

const financialsExample = {
  financialData: {
    maxAge: 86400,
    currentPrice: 20.73,
    targetHighPrice: 26,
    targetLowPrice: 19.5,
    targetMeanPrice: 22.75048,
    targetMedianPrice: 23,
    recommendationKey: 'none',
    numberOfAnalystOpinions: 21,
    totalCash: 2480000000,
    totalCashPerShare: 2.343,
    ebitda: 3652999936,
    totalDebt: 13429999616,
    quickRatio: 0.624,
    currentRatio: 0.888,
    totalRevenue: 21674000384,
    debtToEquity: 162.512,
    revenuePerShare: 20.477,
    returnOnAssets: 0.03178,
    returnOnEquity: 0.13935,
    freeCashflow: 3295160064,
    operatingCashflow: 4527000064,
    earningsGrowth: 2.33,
    revenueGrowth: -0.124,
    grossMargins: 0.38155997,
    ebitdaMargins: 0.16854,
    operatingMargins: 0.16924,
    profitMargins: 0.05015,
    financialCurrency: 'EUR',
  },
  incomeStatement: {
    incomeStatementHistory: [
      {
        maxAge: 1,
        endDate: '2023-12-31T00:00:00.000Z',
        totalRevenue: 25459000000,
        costOfRevenue: 0,
        grossProfit: 0,
        researchDevelopment: null,
        sellingGeneralAdministrative: null,
        nonRecurring: null,
        otherOperatingExpenses: null,
        totalOperatingExpenses: 0,
        operatingIncome: null,
        totalOtherIncomeExpenseNet: null,
        ebit: 0,
        interestExpense: null,
        incomeBeforeTax: null,
        incomeTaxExpense: 0,
        minorityInterest: null,
        netIncomeFromContinuingOps: null,
        discontinuedOperations: null,
        extraordinaryItems: null,
        effectOfAccountingCharges: null,
        otherItems: null,
        netIncome: 742000000,
        netIncomeApplicableToCommonShares: null,
      },
    ],
  },
};

const companyInfoExample = {
  maxAge: 1,
  regularMarketChangePercent: 0.006310639,
  regularMarketChange: 0.12999916,
  regularMarketTime: '2025-01-06T16:35:03.000Z',
  priceHint: 2,
  regularMarketPrice: 20.73,
  regularMarketDayHigh: 20.76,
  regularMarketDayLow: 20.52,
  regularMarketVolume: 792077,
  averageDailyVolume10Day: 1019387,
  averageDailyVolume3Month: 1126712,
  regularMarketPreviousClose: 20.6,
  regularMarketSource: 'DELAYED',
  regularMarketOpen: 20.56,
  exchange: 'MCE',
  exchangeName: 'MCE',
  exchangeDataDelayedBy: 15,
  marketState: 'POSTPOST',
  quoteType: 'EQUITY',
  symbol: 'ELE.MC',
  underlyingSymbol: null,
  shortName: 'ENDESA,S.A.',
  longName: 'Endesa, S.A.',
  currency: 'EUR',
  quoteSourceName: 'Delayed Quote',
  currencySymbol: '€',
  fromCurrency: null,
  toCurrency: null,
  lastMarket: null,
  marketCap: 21943119872,
  previousClose: 20.6,
  open: 20.56,
  dayLow: 20.52,
  dayHigh: 20.76,
  dividendRate: 1,
  dividendYield: 0.047399998,
  exDividendDate: '2025-01-06T00:00:00.000Z',
  payoutRatio: 1.5873,
  fiveYearAvgDividendYield: 7.98,
  beta: 0.628,
  trailingPE: 32.904762,
  forwardPE: 11.453039,
  volume: 792077,
  averageVolume: 1126712,
  averageVolume10days: 1019387,
  bid: 20.66,
  ask: 20.73,
  bidSize: 0,
  askSize: 0,
  fiftyTwoWeekLow: 15.845,
  fiftyTwoWeekHigh: 21.56,
  priceToSalesTrailing12Months: 1.0124167,
  fiftyDayAverage: 20.3222,
  twoHundredDayAverage: 18.851376,
  trailingAnnualDividendRate: 1,
  trailingAnnualDividendYield: 0.048543688,
  coinMarketCapLink: null,
  algorithm: null,
  tradeable: false,
};

export class GetStockInfoDto {
  @ApiProperty({
    description: 'the current price of the stock symbol',
    example: 10,
  })
  current_price: number;
  @ApiProperty({
    description: 'splits of the stock symbol',
    example: '1:1000000000',
  })
  splits: object;
  @ApiProperty({
    description: 'dividend yield of the stock symbol',
    example: 40,
  })
  dividends: object;
  @ApiProperty({
    description: 'company information of the stock symbol',
    example: companyInfoExample,
  })
  company_info: QuoteSummaryResult['price'] &
    QuoteSummaryResult['summaryProfile'] &
    QuoteSummaryResult['summaryDetail'];

  @ApiProperty({
    description: 'financials of the stock symbol',
    example: financialsExample,
  })
  financials: IFinancial;
  recommendations: RecommendationsBySymbolResponse;
}
