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
        // 1. JustWatch 검색 (한국어)
        const searchUrl = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000) // 5초 타임아웃
        });

        if (!searchRes.ok) throw new Error('JustWatch Search Failed');

        const searchHtml = await searchRes.text();

        // 2. 검색 결과에서 첫 번째 콘텐츠 링크 추출
        // 패턴: href="/kr/영화/..." 또는 href="/kr/TV_프로그램/..."
        const linkMatch = searchHtml.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);

        if (!linkMatch) {
            return res.status(200).json({
                exists: false,
                message: 'Content not found in JustWatch',
                fallback: false
            });
        }

        const detailPath = linkMatch[1];
        const detailUrl = `https://www.justwatch.com${detailPath}`;

        // 3. 상세 페이지 접속
        const detailRes = await fetch(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!detailRes.ok) throw new Error('JustWatch Detail Failed');

        const detailHtml = await detailRes.text();

        // 4. 쿠팡플레이 존재 여부 확인
        // 이미지의 alt 속성이나 title 속성으로 확인
        // "Coupang Play" 문자열이 포함되어 있는지 (단순 포함 여부만 확인해도 됨, 상세 페이지니까)
        // 하지만 더 정확히 하기 위해 alt="Coupang Play" 등을 찾음
        const exists = detailHtml.includes('alt="Coupang Play"') || detailHtml.includes('title="Coupang Play"');

        // 가격 정보 추출 (옵션)
        // JustWatch HTML 구조가 복잡해서 정확한 가격 추출은 어려울 수 있으므로 '개별구매' 여부 정도만
        // 일단 존재하면 '구독/개별구매' 텍스트 반환
        let priceText = '검색(이동)';
        let isFree = false;

        // 정액제(구독) 섹션에 있는지 확인하려면 더 복잡한 파싱 필요함.
        // 현재는 '있음' 여부만 확실히 알려주는 게 목표.
        if (exists) {
            // "정액제" 섹션 근처에 있는지 확인하는 건 정규식으로 하기 힘듦.
            // 기본값으로 설정.
            priceText = '보기';
        }

        return res.status(200).json({
            exists: exists,
            price: 0,
            isFree: isFree,
            priceText: priceText,
            rawPrice: 0,
            fallback: false,
            link: detailUrl // JustWatch 링크를 줄 수도 있음
        });

    } catch (error) {
        console.error('Coupang search error:', error);
        return res.status(200).json({
            error: 'Server error',
            message: error.message,
            exists: false,
            fallback: true
        });
    }
}
