import fs from 'fs';

async function findCpLinkOnJustWatch(title) {
    const url = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    console.log(`Checking JustWatch for CP links of: ${title}`);
    try {
        const res = await fetch(proxyUrl);
        const html = await res.text();

        // Search for coupangplay.com in the HTML
        // It might be in the provider icons or links
        const matches = html.match(/https?:\/\/(www\.)?coupangplay\.com\/titles\/[a-zA-Z0-9-]+/g);
        console.log("Coupang Play Links found:", matches || "None");

        // If not found in raw, check the __APOLLO_STATE__
        const marker = 'window.__APOLLO_STATE__ = ';
        const start = html.indexOf(marker);
        if (start !== -1) {
            const end = html.indexOf(';</script>', start);
            const state = html.substring(start + marker.length, end);
            // Search for coupang links in JSON
            const jsonMatches = state.match(/titles\/([a-zA-Z0-9-]{36}|[a-zA-Z0-9]{8})/g);
            console.log("IDs found in JustWatch State:", jsonMatches || "None");
        }
    } catch (e) {
        console.error(e);
    }
}

findCpLinkOnJustWatch('나 홀로 집에');
