async function debugMobileContext(title) {
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(title + " 쿠팡플레이 가격")}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
            }
        });
        const text = await res.text();
        const priceIdx = text.indexOf('4,990');
        if (priceIdx !== -1) {
            console.log("Context around 4990:");
            console.log(text.substring(priceIdx - 300, priceIdx + 300).replace(/<[^>]*>/g, ' '));

            // Search for coupang links in this context
            const idMatch = text.substring(priceIdx - 1000, priceIdx + 1000).match(/titles\/([a-zA-Z0-9-]{36}|[a-zA-Z0-9]{8})/);
            if (idMatch) console.log("FOUND ID:", idMatch[1]);
        }
    } catch (e) {
        console.error(e);
    }
}
debugMobileContext('나 홀로 집에 2');
