import yahooFinance from 'yahoo-finance2';

export default async function getStockInfo(req, res) {
    try {
        const { tickers, info_types } = req.body;
        const result = {};

        for (const ticker of tickers) {
            try {
                const tickerResult = {};

                for (const infoType of info_types) {
                    switch (infoType) {
                        case 'current_price':
                            const quote = await yahooFinance.quote(ticker);
                            tickerResult.current_price = quote.regularMarketPrice;
                            break;

                        case 'splits':
                            const chartOptions = {
                                period1: '1970-01-01',
                                interval: '1d',
                                events: 'splits'
                            };
                            const chartData = await yahooFinance.chart(ticker, chartOptions);
                            tickerResult.splits = chartData.events?.splits?.map(s => ({
                                date: new Date(s.date * 1000).toISOString().split('T')[0],
                                split: `${s.numerator}:${s.denominator}`
                            })) || [];
                            break;

                        case 'dividends':
                            const divChartOptions = {
                                period1: '1970-01-01',
                                interval: '1d',
                                events: 'dividends'
                            };
                            const divData = await yahooFinance.chart(ticker, divChartOptions);
                            tickerResult.dividends = divData.events?.dividends?.map(d => ({
                                date: new Date(d.date * 1000).toISOString().split('T')[0],
                                dividend: d.amount
                            })) || [];
                            break;

                        case 'company_info':
                            const quoteSummary = await yahooFinance.quoteSummary(ticker);
                            tickerResult.company_info = {
                                ...quoteSummary.price,
                                ...quoteSummary.summaryProfile,
                                ...quoteSummary.summaryDetail
                            };
                            break;

                        case 'financials':
                            const financials = await yahooFinance.quoteSummary(ticker, {
                                modules: ['financialData', 'incomeStatementHistory']
                            });
                            tickerResult.financials = {
                                financialData: financials.financialData,
                                incomeStatement: financials.incomeStatementHistory
                            };
                            break;

                        case 'recommendations':
                            const recommendations = await yahooFinance.recommendationsBySymbol(ticker);
                            tickerResult.recommendations = recommendations;
                            break;
                    }
                }
                result[ticker] = tickerResult;
            } catch (error) {
                console.error(`Error fetching data for ${ticker}:`, error);
                result[ticker] = { error: error.message };
            }
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('General error:', error);
        res.status(500).json({ error: error.message });
    }
}

