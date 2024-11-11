export async function fetchWithHandling(url, options) {
    // Define timeouts for different types of requests
    const getTimeout = (url) => {
        if (url.includes('/generateImage') || url.includes('/createSoundEffect')) {
            return 30000; // 30 seconds for media generation
        }
        if (url.includes('/searchWeb')) {
            return 20000; // 20 seconds for web searches
        }
        if (url.includes('/wikiSearch')) {
            return 15000; // 15 seconds for wiki searches
        }
        if (url.includes('/getCryptoInfoFromCMC') || 
            url.includes('/getStockInfo') ||
            url.includes('/searchNftCollection') || 
            url.includes('/searchTrendingNFT')) {
            return 15000; // 15 seconds for financial and NFT data
        }
        return 10000; // 10 seconds default timeout
    };

    const timeout = getTimeout(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        console.log(`Making request to ${url} with ${timeout}ms timeout`);
        const startTime = Date.now();
        
        const response = await fetch(url, { ...options, signal: controller.signal });
        const endTime = Date.now();
        
        clearTimeout(timeoutId);
        console.log(`Request to ${url} completed in ${endTime - startTime}ms`);

        if (!response.ok) {
            const errorResponse = await response.text();
            throw new Error(`Fetch error: ${response.status} - ${response.statusText}. ${errorResponse}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error(`Request timeout after ${timeout/1000} seconds: ${url}`);
            throw new Error(`Request timeout after ${timeout/1000} seconds: ${url}`);
        }
        
        console.error(`Fetch error at ${url}: ${error.message}`);
        throw error;
    }
} 