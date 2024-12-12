export async function fetchWithHandling(url, options) {
    // Define timeouts for different types of requests
    const getTimeout = (url) => {
        if (url.includes('/generateImage') || url.includes('/createSoundEffect')) {
            return 30000; // 30 seconds for media generation
        }
        if (url.includes('/searchWeb')) {
            return 45000; // 45 seconds for web searches (increased from 20s)
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
    let timeoutId;

    try {
        console.log(`Making request to ${url} with ${timeout}ms timeout`);
        const startTime = Date.now();
        
        // Create a promise that rejects after the timeout
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                controller.abort();
                reject(new Error(`Request timeout after ${timeout/1000} seconds: ${url}`));
            }, timeout);
        });
        
        // Ensure headers exist in options
        options.headers = options.headers || {};
        
        // Add user config to headers if it exists globally
        if (global.userConfig) {
            console.log('Found userConfig in global:', global.userConfig);
            options.headers['X-User-Config'] = JSON.stringify(global.userConfig);
        } else {
            console.log('No userConfig found in global');
        }
        
        // Race between the fetch and the timeout
        const response = await Promise.race([
            fetch(url, { ...options, signal: controller.signal }),
            timeoutPromise
        ]);

        const endTime = Date.now();
        clearTimeout(timeoutId);
        
        console.log(`Request to ${url} completed in ${endTime - startTime}ms`);

        if (!response.ok) {
            const errorResponse = await response.text();
            throw new Error(`Fetch error: ${response.status} - ${response.statusText}. ${errorResponse}`);
        }

        return await response.json();
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            console.error(`Request timeout after ${timeout/1000} seconds: ${url}`);
            throw new Error(`Request timeout after ${timeout/1000} seconds: ${url}`);
        }
        
        console.error(`Fetch error at ${url}: ${error.message}`);
        throw error;
    }
} 