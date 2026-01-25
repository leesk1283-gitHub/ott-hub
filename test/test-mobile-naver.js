async function testNaverMobilePrice(title) {
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(title + " 쿠팡플레이 가격")}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
            }
        });
        const text = await res.text();
        console.log(`Mobile Naver Length: ${text.length}`);

        // Search for CP and price
        const pm = text.match(/([0-9,]{3,})\s?원/) || text.match(/₩\s?([0-9,]{3,})/);
        if (pm) {
            console.log(">>> FOUND PRICE ON MOBILE NAVER:", pm[0]);
        } else {
            console.log("No price found on mobile Naver.");
        }
    } catch (e) {
        console.error(e);
    }
}
testNaverMobilePrice('나 홀로 집에 2');
