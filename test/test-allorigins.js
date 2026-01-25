async function testAllOriginsCoupang(keyword) {
    const targetUrl = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(keyword)}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    console.log(`Testing Coupang via AllOrigins for: ${keyword}`);

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents;

        console.log(`Received HTML length: ${html.length}`);

        // Use a simpler check for content existence
        // Usually, search results are in elements like "title-card" or contain the movie title
        const exists = html.includes(keyword) || html.includes('검색 결과');
        console.log(`Keyword "${keyword}" found in HTML: ${html.includes(keyword)}`);

        // Look for store items (Individual purchase)
        const isStore = html.includes('쿠팡플레이 스토어') || html.includes('구매');
        console.log(`Potential store item found: ${isStore}`);

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testAllOriginsCoupang('나 홀로 집에');
