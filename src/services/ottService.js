/**
 * OTT Search Service (Smart Real-Time + Adaptive Scraping Engine V6)
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

/**
 * Fetch streaming data from Streaming Availability API (RapidAPI)
 */
async function fetchByTmdbId(tmdbId, mediaType) {
    try {
        const url = `https://${RAPID_API_HOST}/shows/${mediaType}/${tmdbId}?country=kr`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        if (res.status === 200) return await res.json();
    } catch (e) { }
    return null;
}

export const searchOTT = async (query) => {
    if (!query || !TMDB_API_KEY) return [];

    const queryClean = query.trim();
    const queryNoSpace = queryClean.replace(/\s/g, '').toLowerCase();

    const normalizeProvider = (name) => {
        if (!name) return 'Unknown';
        const lowName = name.toLowerCase();
        if (lowName.includes('disney')) return 'Disney+';
        if (lowName.includes('netflix')) return 'Netflix';
        if (lowName.includes('wavve')) return 'wavve';
        if (lowName.includes('watcha')) return 'Watcha';
        if (lowName.includes('tving')) return 'TVING';
        if (lowName.includes('apple')) return 'Apple TV';
        if (lowName.includes('google')) return 'Google Play';
        if (lowName.includes('youtube')) return 'YouTube';
        if (lowName.includes('naver')) return 'Naver SeriesOn';
        if (lowName.includes('coupang')) return 'Coupang Play';
        return name;
    };

    try {
        let searchRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryClean)}&language=ko-KR&page=1`);
        if (!searchRes.ok) return [];
        let searchData = await searchRes.json();

        if (!searchData.results) return [];

        const itemsToProcess = [...searchData.results.slice(0, 16)];
        const processedCollectionIds = new Set();

        // Collection Expansion
        for (const item of searchData.results.slice(0, 4)) {
            if (item.media_type === 'movie') {
                try {
                    const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                    const details = await detailRes.json();
                    if (details.belongs_to_collection && !processedCollectionIds.has(details.belongs_to_collection.id)) {
                        processedCollectionIds.add(details.belongs_to_collection.id);
                        const cRes = await fetch(`${TMDB_BASE_URL}/collection/${details.belongs_to_collection.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                        const cData = await cRes.json();
                        if (cData.parts) {
                            cData.parts.forEach(part => {
                                if (!itemsToProcess.some(it => it.id === part.id)) itemsToProcess.push({ ...part, media_type: 'movie' });
                            });
                        }
                    }
                } catch (e) { }
            }
        }

        const finalResults = [];
        const priorityItems = itemsToProcess.slice(0, 12);

        for (const item of priorityItems) {
            const type = item.media_type || 'movie';
            const fullTitle = item.title || item.name;
            const providersMap = new Map();
            let kr = null;
            let deepData = null;

            // A. TMDB Watch Providers (Base)
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                kr = wpData.results?.KR;
                if (kr) {
                    ['flatrate', 'buy', 'rent'].forEach(cat => {
                        if (kr[cat]) {
                            kr[cat].forEach(p => {
                                const pName = normalizeProvider(p.provider_name);
                                providersMap.set(pName, {
                                    name: pName,
                                    texts: [cat === 'flatrate' ? '구독(무료)' : `개별구매`],
                                    prices: [cat === 'flatrate' ? 0 : 5000],
                                    type: cat,
                                    link: `https://www.google.com/search?q=${encodeURIComponent(fullTitle + " " + pName)}`
                                });
                            });
                        }
                    });
                }
            } catch (e) { }

            // B. Premium API (Detailed Prices)
            deepData = await fetchByTmdbId(item.id, type);
            if (deepData && deepData.streamingOptions?.kr) {
                deepData.streamingOptions.kr.forEach(opt => {
                    const providerName = normalizeProvider(opt.service?.name || opt.service?.id);
                    let priceVal = opt.price ? parseInt(opt.price.amount) : (opt.type === 'subscription' ? 0 : 5000);
                    let priceText = opt.price
                        ? `${opt.type === 'buy' ? '소장 ' : '대여 '}${priceVal.toLocaleString()}원`
                        : (opt.type === 'subscription' ? '구독(무료)' : '개별구매');

                    if (!providersMap.has(providerName)) {
                        providersMap.set(providerName, { name: providerName, texts: [priceText], prices: [priceVal], type: opt.type, link: opt.link });
                    } else {
                        const existing = providersMap.get(providerName);
                        // 프리미엄 API의 실제 링크가 있으면 기존(구글 검색 등) 링크를 덮어씀
                        if (opt.link) existing.link = opt.link;

                        if (!existing.texts.includes(priceText)) {
                            existing.texts.push(priceText);
                            existing.prices.push(priceVal);
                        }
                    }
                });
            }

            // C. Coupang Play - 무조건 노출 정책 (검색어와 유사하면 기본 제공)
            if (!providersMap.has('Coupang Play')) {
                // 서버 API 호출 시도 (가격 확인용)
                try {
                    const apiUrl = `/api/coupang-search?title=${encodeURIComponent(fullTitle)}`;
                    const cpRes = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
                    const cpData = cpRes.ok ? await cpRes.json() : { exists: true, fallback: true };

                    const isFree = cpData.isFree || false;
                    const priceText = cpData.priceText || (cpData.fallback ? '개별구매' : '개별구매');
                    const priceVal = cpData.rawPrice || (isFree ? 0 : 5000);

                    providersMap.set('Coupang Play', {
                        name: 'Coupang Play',
                        texts: [priceText],
                        prices: [priceVal],
                        type: isFree ? 'subscription' : 'buy',
                        link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                    });
                } catch (e) {
                    // 서버 API 실패해도 쿠팡플레이는 항상 목록에 추가
                    providersMap.set('Coupang Play', {
                        name: 'Coupang Play',
                        texts: ['개별구매'],
                        prices: [5000],
                        type: 'buy',
                        link: `https://www.coupangplay.com/query?src=page_search&keyword=${encodeURIComponent(fullTitle)}`
                    });
                }
            }

            // Final consolidation (아이템별 수집 완료 후 맵에서 최종 결과 배열로 복사)
            providersMap.forEach((info, pName) => {
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                // 고유 ID 생성 (pName이 한글인 경우 대비하여 encode)
                const safeName = pName.replace(/\+/g, 'plus').replace(/\s+/g, '');

                finalResults.push({
                    id: `v8-${item.id}-${safeName}`,
                    title: fullTitle,
                    ott: pName,
                    price: lowestPrice,
                    priceText: combinedText,
                    image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                    description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                    release_date: item.release_date || item.first_air_date || '0000-00-00',
                    link: info.link
                });
            });
        }

        return finalResults.sort((a, b) => {
            const aMatch = a.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            const bMatch = b.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            if (a.release_date !== b.release_date) return b.release_date.localeCompare(a.release_date);
            return a.price - b.price;
        });
    } catch (error) {
        return [];
    }
};

export const getOTTIcon = (ottName) => {
    const name = ottName.toLowerCase();
    if (name.includes('netflix')) return '🔴';
    if (name.includes('disney')) return '🔵';
    if (name.includes('tving')) return '⚪';
    if (name.includes('wavve')) return '🌊';
    if (name.includes('watcha')) return '🌸';
    if (name.includes('coupang')) return '🚀';
    if (name.includes('apple')) return '🍎';
    if (name.includes('google')) return '🎯';
    if (name.includes('youtube')) return '🎬';
    if (name.includes('naver')) return '🟢';
    return '📺';
};

export const formatPrice = (priceText) => priceText;
