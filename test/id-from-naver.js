async function findCpIdFromNaver(title) {
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(title + " 쿠팡플레이")}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl);
        const html = await res.text();

        // Look for links like https://www.coupangplay.com/titles/[id]
        const match = html.match(/coupangplay\.com\/titles\/([a-zA-Z0-9-]{36}|[a-zA-Z0-9]{8})/);
        if (match) {
            console.log(`>>> FOUND CP ID on Naver: ${match[1]}`);
            return match[1];
        } else {
            console.log("CP ID not found in Naver results.");
        }
    } catch (e) {
        console.error(e);
    }
}
findCpIdFromNaver('나 홀로 집에 2');
