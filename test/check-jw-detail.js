async function getJwDetailedPrice(title) {
    const searchUrl = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(searchUrl)}`);
    const html = await res.text();

    // Find detail link
    const match = html.match(/\/kr\/(영화|tv-purogeuraem)\/[^"'\s>]+/);
    if (match) {
        const detailUrl = `https://www.justwatch.com${match[0]}`;
        console.log(`Checking Detail: ${detailUrl}`);
        const dRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(detailUrl)}`);
        const dHtml = await dRes.text();

        // Search for CP and price
        // JustWatch detail pages have prices in the "Buy" or "Rent" section
        // Look for ₩ or 원 near coupang-play
        const cpMarker = 'coupang-play';
        const cpIdx = dHtml.indexOf(cpMarker);
        if (cpIdx !== -1) {
            const context = dHtml.substring(cpIdx - 200, cpIdx + 500);
            console.log("Context found.");
            const pm = context.match(/₩\s?([0-9,]+)/) || context.match(/([0-9,]+)원/);
            if (pm) {
                console.log(">>> EXTRACTED PRICE:", pm[0]);
                return pm[0];
            }
        }
    }
    return null;
}
getJwDetailedPrice('나 홀로 집에 2');
