async function testJwPrices(title) {
    const url = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl);
        const text = await res.text();

        // Search for all monetization items in window.__APOLLO_STATE__
        const startMarker = 'window.__APOLLO_STATE__ = ';
        const start = text.indexOf(startMarker);
        if (start !== -1) {
            const end = text.indexOf(';</script>', start);
            const stateJson = text.substring(start + startMarker.length, end);

            // Search for "Provider:14" (Coupang Play) and "amount"
            // The JSON is huge, let's use regex to find offers
            const results = [];

            // Pattern for offers: "monetizationType":"BUY","presentationType":"HD","retailPrice":5500
            const offerRegex = /"retailPrice":([0-9.]+),"providerId":14/g;
            let match;
            while ((match = offerRegex.exec(stateJson)) !== null) {
                results.push({ type: 'buy', price: match[1] });
            }

            const rentRegex = /"retailPrice":([0-9.]+),"providerId":14,"monetizationType":"RENT"/g;
            while ((match = rentRegex.exec(stateJson)) !== null) {
                results.push({ type: 'rent', price: match[1] });
            }

            console.log(`Results for ${title}:`, results);
        }
    } catch (e) {
        console.error(e);
    }
}
testJwPrices('나 홀로 집에 2');
