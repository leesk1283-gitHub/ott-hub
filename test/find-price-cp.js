async function findPriceInHtml(keyword) {
    const targetUrl = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(keyword)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    console.log(`Deep search on CP for: ${keyword}`);
    try {
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);

        // Search for currency or amounts
        const patterns = [/₩\s?[0-9,]+/, /[0-9,]+원/];
        for (const p of patterns) {
            const m = html.match(p);
            if (m) {
                console.log(`Found pattern ${p}: ${m[0]}`);
                const idx = html.indexOf(m[0]);
                console.log("Context:", html.substring(idx - 100, idx + 100));
            }
        }

        // Search for title links to see if they are different
        const titleMatch = html.match(/\/titles\/[A-Za-z0-9]+/g);
        if (titleMatch) {
            console.log("Title links found:", Array.from(new Set(titleMatch)).slice(0, 5));
        }

    } catch (e) {
        console.log(e);
    }
}

findPriceInHtml('나 홀로 집에');
