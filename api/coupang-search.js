/**
 * Vercel Serverless Function
 * 쿠팡플레이 검색 및 가격 추출
 */

export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { title } = req.query;

    if (!title) {
        return res.status(400).json({ error: 'Title parameter is required' });
    }

    try {
        // 쿠팡플레이 검색
        const searchUrl = `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(title)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'max-age=0',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            timeout: 10000
        });

        // response.ok가 아니어도 일단 HTML을 받아와서 봇 차단 여부를 확인
        const html = await response.text();

        // 봇 차단 감지 (HTML이 너무 짧거나 특정 키워드 포함) - 이건 유지
        if (html.length < 500 || html.includes('Access Denied') || html.includes('차단')) {
            return res.status(200).json({
                error: 'Coupang likely blocked',
                exists: false, // 차단되면 확인 불가하므로 '없음'으로 처리
                fallback: true
            });
        }

        // 검색 결과 분석
        // CSR(Client Side Rendering) 등으로 인해 HTML 소스에 텍스트가 없을 수 있음.
        // 확인되지 않으면 기본적으로 '없음'으로 간주
        const exists = false;

        // 실제 HTML 내용이 궁금하므로 길이는 로깅 (디버깅용)
        const htmlLength = html.length;

        // 가격 추출 시도
        let price = null;
        let isFree = false;
        let priceText = null;

        if (exists) {
            // "개별구매" 텍스트 확인 (있으면 좋고 없어도 그만)
            if (html.includes('개별구매')) {
                priceText = '개별구매';
                const priceMatch = html.match(/([0-9,]+)원/);
                if (priceMatch) {
                    const extracted = parseInt(priceMatch[1].replace(/,/g, ''));
                    if (extracted > 100) price = extracted;
                }
            } else if (html.includes('와우회원 무료')) {
                isFree = true;
                priceText = '와우 회원 무료';
            }
        }

        // JSON 데이터 추출 시도 (__NEXT_DATA__)
        let debugInfo = { foundNextData: false, dataLength: 0, reason: '' };
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);

        if (nextDataMatch && nextDataMatch[1]) {
            debugInfo.foundNextData = true;
            debugInfo.dataLength = nextDataMatch[1].length;

            try {
                const jsonData = JSON.parse(nextDataMatch[1]);
                const jsonStr = JSON.stringify(jsonData);

                // 가격 관련 키워드 검색
                // 쿠팡플레이 데이터 구조 추정: "price", "productPrice", "originalPrice" 등
                const priceMatch = jsonStr.match(/"price":\s*([0-9]+)/) ||
                    jsonStr.match(/"amount":\s*([0-9]+)/);

                if (priceMatch) {
                    price = parseInt(priceMatch[1]);
                    debugInfo.priceFoundInJson = true;
                }

                // 무료 관련 키워드 검색
                if (jsonStr.includes('"isFree":true') || jsonStr.includes('FLATRATE') || jsonStr.includes('WowOnly')) {
                    isFree = true;
                    debugInfo.isFreeFoundInJson = true;
                }

                // 디버깅을 위해 JSON 일부 포함 (너무 길면 자름)
                debugInfo.snippet = jsonStr.substring(0, 500);

            } catch (e) {
                debugInfo.error = e.message;
            }
        } else {
            debugInfo.reason = 'No __NEXT_DATA__ script found in HTML';
        }

        // 쿠팡플레이는 제목이 포함되어 있는지로 판단
        // 검색 결과 페이지의 HTML 내에 영화 제목이 있으면 존재하는 것으로 판정
        const contentExists = html.includes(title) || (jsonData && JSON.stringify(jsonData).includes(title));

        return res.status(200).json({
            exists: contentExists,
            htmlLength: htmlLength,
            price: price,
            isFree: isFree,
            priceText: priceText || (price ? `${price.toLocaleString()}원` : (isFree ? '와우 회원 무료' : '개별구매(앱에서 확인)')),
            rawPrice: price,
            fallback: false,
            debug: debugInfo
        });

    } catch (error) {
        console.error('Coupang search error:', error);
        return res.status(200).json({
            error: 'Server error',
            message: error.message,
            exists: false, // 에러 시에는 우선 없다고 함 (오표시 방지)
            fallback: true
        });
    }
}
