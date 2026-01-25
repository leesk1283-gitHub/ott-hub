async function getCpSearchIds(query) {
    const url = `https://www.coupangplay.com/search?keyword=${encodeURIComponent(query)}`;
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    for (let proxy of proxies) {
        try {
            console.log(`Trying proxy: ${proxy.substring(0, 50)}...`);
            const res = await fetch(proxy, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const text = await res.text();
            console.log(`   Length: ${text.length}`);

            // Search for "titles/[id]"
            const matches = text.match(/\/titles\/([a-zA-Z0-9-]{36}|[a-zA-Z0-9]{8})/g);
            if (matches) {
                console.log("   >>> FOUND IDs:", matches.slice(0, 5));
                return matches.map(m => m.split('/').pop());
            }
        } catch (e) {
            console.log(`   Failed: ${e.message}`);
        }
    }
    return [];
}

getCpSearchIds('나 홀로 집에');
