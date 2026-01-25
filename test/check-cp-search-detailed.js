async function checkCoupangSearchDetailed(keyword) {
    const cpSearchUrl = `https://www.coupangplay.com/search?keyword=${encodeURIComponent(keyword)}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(cpSearchUrl)}`;

    console.log(`Checking CP Search for: ${keyword}`);
    try {
        const res = await fetch(proxyUrl);
        const html = await res.text();

        // Search for title links like "/titles/..."
        const titleRegex = /\/titles\/([A-Za-z0-9]+)/g;
        let match;
        const titlesFound = [];
        while ((match = titleRegex.exec(html)) !== null) {
            titlesFound.push(match[0]);
        }

        console.log(`Found ${titlesFound.length} title links.`);
        if (titlesFound.length > 0) {
            console.log("Unique title IDs:", Array.from(new Set(titlesFound)).slice(0, 5));
        }

        // Check if keyword exists in any script tags or hidden JSON
        if (html.includes(keyword)) {
            console.log(`Keyword "${keyword}" found in HTML source.`);
        }

    } catch (e) {
        console.error(e);
    }
}

checkCoupangSearchDetailed('나 홀로 집에');
