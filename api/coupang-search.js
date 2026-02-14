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
        const searchUrl = `https://www.justwatch.com/kr/검색?q=${encodeURIComponent(title)}`;

        // 헤더 설정 (중요: User-Agent, Accept-Language)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        };

        const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(5000) });

        if (!searchRes.ok) {
            throw new Error(`JustWatch Search Failed: ${searchRes.status}`);
        }

        const searchHtml = await searchRes.text();

        // 첫 번째 결과 링크 추출
        // 영화: /kr/영화/...
        // TV: /kr/TV_프로그램/...
        const linkMatch = searchHtml.match(/href="(\/kr\/(?:영화|TV_프로그램)\/[^"]+)"/);

        if (!linkMatch) {
            return res.status(200).json({
                exists: false,
                message: 'Content not found in JustWatch',
                fallback: false
            });
        }

        const detailUrl = `https://www.justwatch.com${linkMatch[1]}`;

        // 상세 페이지 가져오기
        const detailRes = await fetch(detailUrl, { headers, signal: AbortSignal.timeout(5000) });

        if (!detailRes.ok) {
            throw new Error(`JustWatch Detail Failed: ${detailRes.status}`);
        }

        const detailHtml = await detailRes.text();

        // 중요: 단순 텍스트 "Coupang Play"는 필터바 등에도 존재하여 오탐 발생
        // "shortName":"cpx" 패턴이 실제 오퍼(Offer) 정보에 포함된 것으로 확인됨 ("Home Alone 1" vs "4" 테스트 결과)
        // cpx는 JustWatch 내부에서 Coupang Play(혹은 연동된 식별자)를 의미
        const exists = /"shortName":"cpx"/.test(detailHtml);

        let priceText = '검색(이동)';
        let isFree = false;
        let price = 0;

        if (exists) {
            // 상세 페이지에서 "정액제" 섹션에 있는지 등을 파악하면 좋겠지만
            // HTML 구조가 복잡하므로 일단 존재하면 '보기'로 표기
            priceText = '보기';
            // 무료 여부는 알 수 없으나 보통 구독제이므로
            isFree = true;
        }

        return res.status(200).json({
            exists: exists,
            price: price,
            isFree: isFree,
            priceText: priceText,
            rawPrice: price,
            fallback: false,
            link: detailUrl,
            providerName: 'JustWatch Web Scraping (cpx check)'
        });

    } catch (error) {
        console.error('JustWatch scraping error:', error);
        return res.status(200).json({
            error: 'Server error',
            message: error.message,
            exists: false, // 에러 발생 시 없음으로 처리
            fallback: true
        });
    }
}
