import yahooFinance from 'yahoo-finance2';

export default async function getStockInfo(req, res) {
    try {
        const { tickers, info_types } = req.body;
        const result = {};

        for (const ticker of tickers) {
            try {
                const stockInfo = await yahooFinance.quote(ticker);
                const tickerResult = {};

                for (const infoType of info_types) {
                    switch (infoType) {
                        case 'current_price':
                            tickerResult.current_price = stockInfo.regularMarketPrice;
                            break;

                        case 'dividends':
                            const dividends = await yahooFinance.historical(ticker, {
                                events: 'dividends'
                            });
                            tickerResult.dividends = dividends.map(d => ({
                                date: d.date.toISOString().split('T')[0],
                                dividend: d.dividend
                            }));
                            break;

                        case 'splits':
                            const splits = await yahooFinance.historical(ticker, {
                                events: 'splits'
                            });
                            tickerResult.splits = splits.map(s => ({
                                date: s.date.toISOString().split('T')[0],
                                split: s.split
                            }));
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
                result[ticker] = { error: error.message };
            }
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

