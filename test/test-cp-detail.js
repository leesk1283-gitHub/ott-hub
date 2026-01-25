async function testSpecificCpUrl(url) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    console.log(`Testing Specific CP URL: ${url}`);
    try {
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        const html = await res.text();
        console.log(`Length: ${html.length}`);

        // Search for price or amount in the whole text
        // Look for ₩ or "원"
        const priceMatch = html.match(/₩\s?([0-9,]{3,})/) || html.match(/([0-9,]{3,})\s?원/);
        if (priceMatch) {
            console.log("FOUND PRICE IN HTML:", priceMatch[0]);
        }

        // Search for __NEXT_DATA__
        const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
        if (match) {
            const json = JSON.parse(match[1]);
            require('fs').writeFileSync('cp_detail_debug.json', JSON.stringify(json, null, 2));
            console.log("Saved cp_detail_debug.json");

            // Try to find price in JSON
            const str = JSON.stringify(json);
            const amountMatch = str.match(/"amount":\s?([0-9.]+)/);
            if (amountMatch) {
                console.log("FOUND AMOUNT IN JSON:", amountMatch[1]);
            }
        } else {
            console.log("No __NEXT_DATA__ found.");
            // Log the first 500 chars to see if it's a redirect/error page
            console.log("Snippet:", html.substring(0, 500));
        }

    } catch (e) {
        console.error(e);
    }
}

const url = "https://www.coupangplay.com/titles/e88143a6-af03-4a76-a37e-ede8e3b1fc36?type=MOVIE&availability=TVOD&src=page_search";
testSpecificCpUrl(url);
