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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Coupang search failed',
                exists: false
            });
        }

        const html = await response.text();

        // 검색 결과 분석
        const titleWords = title.split(' ').filter(w => w.length > 1);
        const exists = html.length > 5000 && titleWords.every(word => html.includes(word));

        if (!exists) {
            return res.status(200).json({
                exists: false,
                message: 'Content not found on Coupang Play'
            });
        }

        // 가격 추출 시도
        let price = null;
        let isFree = false;

        // __NEXT_DATA__ JSON에서 가격 추출 시도
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
        if (nextDataMatch) {
            try {
                const jsonData = JSON.parse(nextDataMatch[1]);
                // 가격 정보 탐색 (실제 구조는 응답을 보고 조정 필요)
                const jsonStr = JSON.stringify(jsonData);

                // "price", "amount" 등의 키워드로 가격 찾기
                const priceMatches = jsonStr.match(/"price[^"]*":\s*([0-9]+)/gi) ||
                    jsonStr.match(/"amount":\s*([0-9]+)/gi);

                if (priceMatches && priceMatches.length > 0) {
                    const priceMatch = priceMatches[0].match(/([0-9]+)/);
                    if (priceMatch) {
                        price = parseInt(priceMatch[1]);
                    }
                }

                // "free", "flatrate" 등으로 무료 여부 확인
                isFree = jsonStr.includes('"isFree":true') ||
                    jsonStr.includes('"type":"FLATRATE"') ||
                    jsonStr.includes('와우');
            } catch (e) {
                console.error('JSON parsing failed:', e.message);
            }
        }

        // HTML에서 직접 가격 추출 시도
        if (!price) {
            const pricePattern = /₩\s?([0-9,]{3,})|([0-9,]{3,})\s?원/g;
            const matches = [...html.matchAll(pricePattern)];

            for (const match of matches) {
                const priceStr = (match[1] || match[2]).replace(/,/g, '');
                const priceNum = parseInt(priceStr);

                // 1000원~50000원 사이의 합리적인 가격만
                if (priceNum >= 1000 && priceNum <= 50000) {
                    price = priceNum;
                    break;
                }
            }
        }

        return res.status(200).json({
            exists: true,
            price: price,
            isFree: isFree || price === 0,
            priceText: price ? `${price.toLocaleString()}원` : (isFree ? '와우 회원 무료' : '가격 확인 필요'),
            rawPrice: price
        });

    } catch (error) {
        console.error('Coupang search error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message,
            exists: false
        });
    }
}
