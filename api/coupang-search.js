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

        if (!response.ok) {
            // 차단되거나 에러가 나도 일단은 fallback으로 처리 (클라이언트에서 기본값 표시)
            return res.status(200).json({
                error: 'Coupang request failed',
                exists: true,
                fallback: true
            });
        }

        const html = await response.text();

        // 검색 결과 분석
        const normalizedTitle = title.replace(/\s+/g, '');
        const normalizedHtml = html.replace(/\s+/g, '');
        const titleWords = title.split(' ').filter(w => w.length > 1);

        // 존재 여부 판단 강화
        // 1. 제목 포함 여부
        const titleMatch = normalizedHtml.includes(normalizedTitle) ||
            titleWords.every(word => html.includes(word));

        // 2. 핵심 키워드 포함 여부 ("개별구매", "무료", "재생하기" 등)
        const keywordMatch = html.includes('개별구매') || html.includes('와우회원') || html.includes('무료') || html.includes('구매');

        // 제목이 있고 콘텐츠 관련 키워드도 있으면 확실함
        const exists = html.length > 3000 && titleMatch;

        // 가격 추출 시도
        let price = null;
        let isFree = false;
        let priceText = null;

        if (exists) {
            // "개별구매" 텍스트 확인
            if (html.includes('개별구매')) {
                priceText = '개별구매';
                // 가격 숫자 추출 시도
                const priceMatch = html.match(/([0-9,]+)원/);
                if (priceMatch) {
                    const extracted = parseInt(priceMatch[1].replace(/,/g, ''));
                    if (extracted > 100) price = extracted;
                }
            } else if (html.includes('와우회원 무료') || html.includes('기본 월정액')) {
                isFree = true;
                priceText = '와우 회원 무료';
            }
        }

        return res.status(200).json({
            exists: exists,
            price: price,
            isFree: isFree,
            priceText: priceText || (price ? `${price.toLocaleString()}원` : (isFree ? '와우 회원 무료' : '개별구매(확인 필요)')),
            rawPrice: price,
            fallback: false // 정상 응답이므로 fallback 아님
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
