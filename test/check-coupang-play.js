async function checkCoupangPlay(keyword) {
    const url = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(keyword)}`;
    console.log(`Checking Coupang Play for: ${keyword}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response length: ${text.length}`);

        if (text.includes('__NEXT_DATA__')) {
            console.log("SUCCESS: Found __NEXT_DATA__ in response.");
            // Extract a bit of it
            const start = text.indexOf('__NEXT_DATA__');
            console.log(text.substring(start, start + 1000));
        } else {
            console.log("FAILURE: __NEXT_DATA__ not found.");
        }

        if (text.includes(keyword)) {
            console.log(`SUCCESS: Found keyword "${keyword}" in response.`);
        } else {
            console.log(`FAILURE: Keyword "${keyword}" not found in response.`);
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

checkCoupangPlay('나 홀로 집에');
