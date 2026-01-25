/**
 * OTT Search Service (Smart Real-Time + Premium Pricing)
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
const TMDB_API_KEY = 'eb11bb474eef7856758589fb09e65c29';

const RAPID_API_KEY = 'fdd47c2553mshd19015530c43e2cp1a9d7djsn31c6ad035190';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';

// Targeted Correction Layer (Only for verified direct links or API error corrections)
const KR_DATA_PATCHES = {
    // Zootopia
    269149: [
        { ott: 'Coupang Play', text: 'OTT 앱에서 확인(구매)', type: 'buy', price: 99999, link: 'https://www.coupangplay.com/query?src=page_search&keyword=%EC%A3%BC%ED%86%A0%ED%94%BC%EC%95%84' }
    ],
    // 나 홀로 집에 (Home Alone)
    771: [
        { ott: 'Apple TV', text: '대여 2,500원 / 구매 5,000원', type: 'buy', price: 2500, link: 'https://tv.apple.com/kr/movie/%EB%82%98-%ED%99%80%EB%A1%9C-%EC%A7%91%EC%97%90/umc.cmc.25iylu09f7scc2q78672d6v86' },
        { ott: 'Google Play', text: '대여 1,500원 / 구매 5,500원', type: 'buy', price: 1500, link: 'https://play.google.com/store/search?q=%EB%82%98%ED%99%80%EB%A1%9C%EC%A7%91%EC%97%90&c=movies' },
        { ott: 'YouTube', text: '대여 1,500원 / 구매 5,500원', type: 'buy', price: 1500, link: 'https://www.youtube.com/results?search_query=%EB%82%98%ED%99%80%EB%A1%9C%EC%A7%91%EC%97%90+%EA%B5%AC%EB%A7%A4' }
    ],
    // 나 홀로 집에 2
    772: [
        { ott: 'Apple TV', text: '대여 2,500원 / 구매 5,500원', type: 'buy', price: 2500, link: 'https://tv.apple.com/kr/movie/%EB%82%98-%ED%99%80%EB%A1%9C-%EC%A7%91%EC%97%90-2-%EB%89%B4%EC%9A%95%EC%9D%84-%ED%97%A4%EB%A7%A4%EB%8B%A4/umc.cmc.1i85r5v8o278t0d7yuj385e0m' },
        { ott: 'Google Play', text: '대여 1,500원 / 구매 5,500원', type: 'buy', price: 1500, link: 'https://play.google.com/store/search?q=%EB%82%98%ED%99%80%EB%A1%9C%EC%A7%91%EC%97%902&c=movies' }
    ]
};

/**
 * Fetch streaming data from Streaming Availability API via TMDB ID
 */
async function fetchByTmdbId(tmdbId, mediaType) {
    try {
        const url = `https://${RAPID_API_HOST}/shows/${mediaType}/${tmdbId}?country=kr`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
        });
        if (res.status === 200) {
            return await res.json();
        }
    } catch (e) {
        console.warn(`TMDB ID Lookup failed for ${tmdbId}:`, e);
    }
    return null;
}

export const searchOTT = async (query) => {
    if (!query || !TMDB_API_KEY) return [];

    const queryClean = query.trim();
    const queryNoSpace = queryClean.replace(/\s/g, '').toLowerCase();

    // Normalize provider names for consistency
    const normalizeProvider = (name) => {
        if (!name) return 'Unknown';
        const lowName = name.toLowerCase();
        if (lowName.includes('disney')) return 'Disney+';
        if (lowName.includes('netflix')) return 'Netflix';
        if (lowName.includes('wavve')) return 'wavve';
        if (lowName.includes('watcha')) return 'Watcha';
        if (lowName.includes('tving')) return 'TVING';
        if (lowName.includes('apple')) return 'Apple TV';
        if (lowName.includes('coupang')) return 'Coupang Play';
        return name;
    };

    // Generate direct search links for each provider
    const getProviderSearchLink = (providerName, title) => {
        const encodedTitle = encodeURIComponent(title);
        const providerLinks = {
            'Netflix': `https://www.netflix.com/search?q=${encodedTitle}`,
            'Disney+': `https://www.disneyplus.com/search?q=${encodedTitle}`,
            'Coupang Play': `https://www.coupangplay.com/query?src=page_search&keyword=${encodedTitle}`,
            'Watcha': `https://watcha.com/search?query=${encodedTitle}`,
            'wavve': `https://www.wavve.com/search?searchWord=${encodedTitle}`,
            'Apple TV': `https://tv.apple.com/kr/search?term=${encodedTitle}`,
            'Google Play Movies': `https://play.google.com/store/search?q=${encodedTitle}&c=movies`,
            'TVING': `https://www.tving.com/search?keyword=${encodedTitle}`,
            'Amazon Prime Video': `https://www.primevideo.com/search?phrase=${encodedTitle}`,
            'Naver Store': `https://m.series.naver.com/search/search.series?keyword=${encodedTitle}`,
        };
        return providerLinks[providerName] || null;
    };

    try {
        let searchRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryClean)}&language=ko-KR&page=1`);
        let searchData = await searchRes.json();

        // 1.1 Smart Spacing Fallback
        if (!queryClean.includes(' ') && queryClean.length >= 2) {
            const fallbackResults = [];
            for (let i = 1; i < queryClean.length; i++) {
                const fq = queryClean.slice(0, i) + ' ' + queryClean.slice(i);
                try {
                    const fRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fq)}&language=ko-KR&page=1`);
                    const fData = await fRes.json();
                    if (fData.results) fallbackResults.push(...fData.results);
                } catch (err) { }
            }
            if (fallbackResults.length > 0) {
                if (!searchData.results) searchData.results = [];
                const existingIds = new Set(searchData.results.map(r => r.id));
                fallbackResults.forEach(r => {
                    if (!existingIds.has(r.id)) {
                        searchData.results.push(r);
                        existingIds.add(r.id);
                    }
                });
            }
        }

        if (!searchData.results) return [];

        let itemsToProcess = [...searchData.results.slice(0, 16)];
        const processedCollectionIds = new Set();

        // 2. Collection Expansion
        for (const item of searchData.results.slice(0, 4)) {
            if (item.media_type === 'movie') {
                try {
                    const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${item.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                    const details = await detailRes.json();
                    if (details.belongs_to_collection && !processedCollectionIds.has(details.belongs_to_collection.id)) {
                        const cId = details.belongs_to_collection.id;
                        processedCollectionIds.add(cId);
                        const cRes = await fetch(`${TMDB_BASE_URL}/collection/${cId}?api_key=${TMDB_API_KEY}&language=ko-KR`);
                        const cData = await cRes.json();
                        if (cData.parts) {
                            cData.parts.forEach(part => {
                                if (!itemsToProcess.some(it => it.id === part.id)) {
                                    itemsToProcess.push({ ...part, media_type: 'movie' });
                                }
                            });
                        }
                    }
                } catch (e) { }
            }
        }

        // 3. (Optional) Removed title search as ID lookup is more precise for prices
        let pricingMap = new Map();

        const finalResults = [];
        const priorityItems = itemsToProcess.slice(0, 15);

        for (const item of priorityItems) {
            const type = item.media_type || 'movie';
            const fullTitle = item.title || item.name;
            const originalTitle = item.original_title || item.original_name || '';
            const titleKey = fullTitle.toLowerCase().replace(/\s/g, '');
            const originalKey = originalTitle.toLowerCase().replace(/\s/g, '');

            if (queryClean.length >= 3 && !titleKey.includes(queryNoSpace) && !originalKey.includes(queryNoSpace)) {
                continue;
            }

            let providersMap = new Map(); // providerName -> { text, price, type, link }

            // A. Premium API (Primary source for actual prices)
            const deepData = await fetchByTmdbId(item.id, type);
            if (deepData && deepData.streamingOptions?.kr) {
                deepData.streamingOptions.kr.forEach(opt => {
                    const providerName = normalizeProvider(opt.service?.name || opt.service?.id || '알 수 없음');
                    let priceVal = opt.price ? parseInt(opt.price.amount) : 0;
                    let priceText = opt.price
                        ? `${opt.type === 'buy' ? '구매 ' : '대여 '}${priceVal.toLocaleString()}원`
                        : (opt.type === 'subscription' ? '구독(무료)' : (opt.type === 'free' ? '무료' : '확인 필요'));

                    if (!providersMap.has(providerName)) {
                        providersMap.set(providerName, {
                            name: providerName,
                            texts: [priceText],
                            prices: [priceVal],
                            type: opt.type,
                            link: opt.link
                        });
                    } else {
                        const existing = providersMap.get(providerName);
                        if (!existing.texts.includes(priceText)) {
                            existing.texts.push(priceText);
                            existing.prices.push(priceVal);
                        }
                    }
                });
            }

            // B. TMDB Watch Providers (Fallback)
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                const kr = wpData.results?.KR;
                if (kr) {
                    ['flatrate', 'buy', 'rent'].forEach(cat => {
                        if (kr[cat]) {
                            kr[cat].forEach(p => {
                                const pName = normalizeProvider(p.provider_name);
                                if (!providersMap.has(pName)) {
                                    const directLink = getProviderSearchLink(pName, fullTitle);
                                    providersMap.set(pName, {
                                        name: pName,
                                        texts: [cat === 'flatrate' ? '구독(무료)' : `앱에서 확인(${cat === 'buy' ? '구매' : '대여'})`],
                                        prices: [cat === 'flatrate' ? 0 : 99999],
                                        type: cat,
                                        link: directLink || kr.link
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (e) { }

            // D. Manual Patches (Array-ready)
            if (KR_DATA_PATCHES[item.id]) {
                const patches = KR_DATA_PATCHES[item.id];
                patches.forEach(patch => {
                    const pName = patch.ott;
                    providersMap.set(pName, {
                        name: pName,
                        texts: [patch.text],
                        prices: [patch.price || 0],
                        type: patch.type || 'subscription',
                        link: patch.link
                    });
                });
            }

            // Final consolidation and push
            providersMap.forEach((info, pName) => {
                // Combine texts like '대여 2,500원 / 구매 5,000원'
                const combinedText = info.texts.join(' / ');
                const lowestPrice = Math.min(...info.prices);

                if (!finalResults.some(r => r.title === fullTitle && r.ott === pName)) {
                    let priceText = combinedText;
                    let note = null;

                    // Condition for Netflix ad-plan warning or other long info
                    if (priceText.length > 35 && (priceText.includes('광고') || priceText.includes('제한') || priceText.includes('라이선스'))) {
                        note = '광고형 멤버십 제외';
                        priceText = '구독(무료)';
                    }

                    finalResults.push({
                        id: `res-prec-${item.id}-${pName}`,
                        title: fullTitle,
                        ott: pName,
                        price: lowestPrice,
                        priceText: priceText,
                        image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                        description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                        release_date: item.release_date || item.first_air_date || '0000-00-00',
                        link: info.link,
                        note: note
                    });
                }
            });
        }

        return finalResults
            .filter(r => r.ott !== 'Coupang Play')
            .sort((a, b) => {
                const aMatch = a.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
                const bMatch = b.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                if (a.release_date !== b.release_date) return b.release_date.localeCompare(a.release_date);
                return a.price - b.price;
            });
    } catch (error) {
        console.error("Search API Error:", error);
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
    if (name.includes('naver')) return '🟢';
    return '📺';
};

export const formatPrice = (priceText) => priceText;
