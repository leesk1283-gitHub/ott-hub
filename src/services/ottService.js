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
    // Home Alone Series - User Verified Direct Links
    771: { ott: 'Coupang Play', text: '5,500원(구매)', type: 'buy', price: 5500, link: 'https://www.coupangplay.com/titles/e88143a6-af03-4a76-a37e-ede8e3b1fc36' },
    772: { ott: 'Coupang Play', text: '5,500원(구매)', type: 'buy', price: 5500, link: 'https://www.coupangplay.com/titles/9f62a88f-6e32-43ff-9ff4-da4526523edc' },
    9714: { ott: 'Coupang Play', text: '5,500원(구매)', type: 'buy', price: 5500, link: 'https://www.coupangplay.com/titles/7611d2a3-b992-499b-a9cb-52370194d960' },

    // The Worst of Evil - Verified Disney+ Link
    210704: { ott: 'Disney+', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.disneyplus.com/series/the-worst-of-evil/29IM2a96KyDP' },

    // Attack on Titan (진격의 거인) - Series and Movies Coverage Fix
    1429: { // Main Series
        patches: [
            { ott: 'Netflix', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.netflix.com/title/70299043/' },
            { ott: 'Watcha', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://watcha.com/search?query=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8' },
            { ott: 'wavve', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.wavve.com/search?searchWord=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8' },
            { ott: 'TVING', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.tving.com/search?keyword=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8' }
        ],
        excludes: ['Apple TV']
    },
    379088: { // Crimson Bow and Arrow (홍련의 화살)
        patches: [
            { ott: 'Watcha', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://watcha.com/contents/mWJyLqx' },
            { ott: 'wavve', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.wavve.com/search?searchWord=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8%20%ED%99%8D%EB%A0%A8%EC%9D%98%20%ED%99%94%EC%82%B4' }
        ],
        excludes: ['Apple TV']
    },
    330081: { // Wings of Freedom (자유의 날개)
        patches: [
            { ott: 'TVING', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.tving.com/search?keyword=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8%20%EC%9E%90%EC%9C%A0%EC%9D%98%20%EB%82%A0%EA%B0%9C' },
            { ott: 'wavve', text: '구독(무료)', type: 'subscription', price: 0, link: 'https://www.wavve.com/search?searchWord=%EC%A7%84%EA%B2%A9%EC%9D%98%20%EA%B1%B0%EC%9D%B8%20%EC%9E%90%EC%9C%A0%EC%9D%98%20%EB%82%A0%EA%B0%9C' }
        ],
        excludes: ['Apple TV']
    },
    714194: { // Chronicle
        excludes: ['Apple TV']
    },
    1333100: { // The Last Attack
        excludes: ['Apple TV']
    },
    492999: { // Roar of Awakening (각성의 포효)
        excludes: ['Apple TV']
    },
    269149: { // Zootopia
        patches: [
            { ott: 'Coupang Play', text: 'OTT 앱에서 확인(구매)', type: 'buy', price: 99999, link: 'https://www.coupangplay.com/query?src=page_search&keyword=%EC%A3%BC%ED%86%A0%ED%94%BC%EC%95%84' }
        ]
    }
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
        return name;
    };

    // Generate direct search links for each provider (fallback for TMDB's generic link)
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
            'seezn': `https://www.seezn.com/search?keyword=${encodedTitle}`,
            'Naver Store': `https://m.series.naver.com/search/search.series?keyword=${encodedTitle}`,
            'Crunchyroll': `https://www.crunchyroll.com/search?q=${encodedTitle}`,
        };
        return providerLinks[providerName] || null;
    };

    try {
        let searchRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryClean)}&language=ko-KR&page=1`);
        let searchData = await searchRes.json();

        // 1.1 Smart Spacing Fallback for Korean (e.g., "데드풀과울버린" -> "데드풀과 울버린")
        // Always try inserting a space for no-space queries to maximize results
        if (!queryClean.includes(' ') && queryClean.length >= 2) {
            const fallbackResults = [];
            // Try inserting a space at EVERY possible position
            for (let i = 1; i < queryClean.length; i++) {
                const fq = queryClean.slice(0, i) + ' ' + queryClean.slice(i);
                try {
                    const fRes = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fq)}&language=ko-KR&page=1`);
                    const fData = await fRes.json();
                    if (fData.results && fData.results.length > 0) {
                        fallbackResults.push(...fData.results);
                    }
                } catch (err) {
                    console.warn(`Fallback search failed for ${fq}:`, err);
                }
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
            }
        }

        // 3. Initial Pricing API Title Search (Broad Match)
        let pricingMap = new Map();
        try {
            const pricingUrl = `https://${RAPID_API_HOST}/shows/search/title?title=${encodeURIComponent(queryClean)}&country=kr`;
            const pricingRes = await fetch(pricingUrl, {
                method: 'GET',
                headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST }
            });
            if (pricingRes.status === 200) {
                const pricingData = await pricingRes.json();
                const shows = Array.isArray(pricingData) ? pricingData : pricingData.result;
                if (shows) {
                    shows.forEach(show => {
                        const krOptions = show.streamingOptions?.kr;
                        if (krOptions) {
                            const tKey = (show.title || '').toLowerCase().replace(/\s/g, '');
                            const oKey = (show.originalTitle || '').toLowerCase().replace(/\s/g, '');
                            if (tKey) pricingMap.set(tKey, krOptions);
                            if (oKey) pricingMap.set(oKey, krOptions);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Pricing Title Lookup Failed:", e);
        }

        // 4. Aggregation with Targeted Lookups
        const results = [];
        // Process top results with deep inspection
        const priorityItems = itemsToProcess.slice(0, 15);

        for (const item of priorityItems) {
            const type = item.media_type || 'movie';
            const fullTitle = item.title || item.name;
            const originalTitle = item.original_title || item.original_name || '';
            const titleKey = fullTitle.toLowerCase().replace(/\s/g, '');
            const originalKey = originalTitle.toLowerCase().replace(/\s/g, '');

            // Strict Filter for "최악의 악" case
            if (queryClean.length >= 3 && !titleKey.includes(queryNoSpace) && !originalKey.includes(queryNoSpace)) {
                continue;
            }

            let providers = [];

            // A. Check Pricing Map (from Title Search)
            let premiumOptions = pricingMap.get(titleKey) || pricingMap.get(originalKey);

            // B. If no premium options, try targeted TMDB ID lookup (Maximize KR Coverage)
            if (!premiumOptions) {
                const deepData = await fetchByTmdbId(item.id, type);
                if (deepData && deepData.streamingOptions?.kr) {
                    premiumOptions = deepData.streamingOptions.kr;
                }
            }

            if (premiumOptions) {
                premiumOptions.forEach(opt => {
                    const providerName = normalizeProvider(opt.service?.name || opt.service?.id || '알 수 없음');
                    let priceText = opt.price
                        ? `${opt.price.amount.toLocaleString()}${opt.price.currency === 'KRW' ? '원' : opt.price.currency}(${opt.type === 'buy' ? '구매' : '대여'})`
                        : (opt.type === 'subscription' ? '구독(무료)' : (opt.type === 'free' ? '무료' : '확인 필요'));

                    // Special Disclosure: Netflix Home Alone Restrictions
                    if (providerName === 'Netflix' && fullTitle.includes('나 홀로 집에')) {
                        priceText += '\n광고형 멤버십 이용 불가';
                    }

                    providers.push({
                        provider_name: providerName,
                        text: priceText,
                        price: opt.price ? opt.price.amount : 0,
                        type: opt.type,
                        link: opt.link
                    });
                });
            }

            // C. ALSO check TMDB Watch Providers (Merge with Premium API for maximum coverage)
            // TMDB often has Korean OTT data that Premium API is missing (e.g., Watcha, TVING, Crunchyroll)
            try {
                const wpRes = await fetch(`${TMDB_BASE_URL}/${type}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`);
                const wpData = await wpRes.json();
                const kr = wpData.results?.KR;
                if (kr) {
                    // Add TMDB providers that don't already exist from Premium API
                    const existingProviders = new Set(providers.map(p => p.provider_name));

                    if (kr.flatrate) kr.flatrate.forEach(p => {
                        const pName = normalizeProvider(p.provider_name);
                        if (!existingProviders.has(pName)) {
                            const directLink = getProviderSearchLink(pName, fullTitle);
                            let pText = '구독(무료)';
                            if (pName === 'Netflix' && fullTitle.includes('나 홀로 집에')) {
                                pText += '\n광고형 멤버십 이용 불가';
                            }
                            providers.push({ provider_name: pName, text: pText, price: 0, type: 'flatrate', link: directLink || kr.link });
                        }
                    });
                    if (kr.buy) kr.buy.forEach(p => {
                        const pName = normalizeProvider(p.provider_name);
                        if (!existingProviders.has(pName)) {
                            const directLink = getProviderSearchLink(pName, fullTitle);
                            providers.push({ provider_name: pName, text: 'OTT 앱에서 확인(구매)', price: 99999, type: 'buy', link: directLink || kr.link });
                        }
                    });
                    if (kr.rent) kr.rent.forEach(p => {
                        const pName = normalizeProvider(p.provider_name);
                        if (!existingProviders.has(pName)) {
                            const directLink = getProviderSearchLink(pName, fullTitle);
                            providers.push({ provider_name: pName, text: 'OTT 앱에서 확인(대여)', price: 99998, type: 'rent', link: directLink || kr.link });
                        }
                    });
                }
            } catch (e) {
                console.warn(`TMDB Provider lookup failed for ${item.id}:`, e);
            }

            // D. Apply Manual Data Patches (Highest Authority - Merges and Fixes API data)
            if (KR_DATA_PATCHES[item.id]) {
                const patchData = KR_DATA_PATCHES[item.id];
                const patches = Array.isArray(patchData)
                    ? patchData
                    : (patchData.patches ? patchData.patches : (patchData.ott ? [patchData] : []));
                const excludes = patchData.excludes || [];

                // 1. Filter out excluded providers
                if (excludes.length > 0) {
                    providers = providers.filter(p => !excludes.includes(p.provider_name));
                }

                // 2. Overwrite existing or add new from patches
                patches.forEach(patch => {
                    const existingIdx = providers.findIndex(p => p.provider_name === patch.ott);
                    const patchObj = {
                        provider_name: patch.ott,
                        text: patch.text,
                        price: patch.price || 0,
                        type: patch.type || 'subscription',
                        link: patch.link
                    };
                    if (existingIdx !== -1) {
                        providers[existingIdx] = patchObj;
                    } else {
                        providers.push(patchObj);
                    }
                });
            }

            for (const p of providers) {
                if (!results.some(r => r.title === fullTitle && r.ott === p.provider_name)) {
                    results.push({
                        id: `res-fixed-${item.id}-${p.provider_name}`,
                        title: fullTitle,
                        ott: p.provider_name,
                        price: p.price,
                        priceText: p.text,
                        image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
                        description: item.overview ? item.overview.slice(0, 100) + '...' : '내용 설명이 없습니다.',
                        release_date: item.release_date || item.first_air_date || '0000-00-00',
                        link: p.link
                    });
                }
            }
        }
        return results.sort((a, b) => {
            const aMatch = a.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            const bMatch = b.title.replace(/\s/g, '').toLowerCase() === queryNoSpace;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;

            const titleA = a.title.replace(/\s/g, '');
            const titleB = b.title.replace(/\s/g, '');
            if (titleA.substring(0, 4) !== titleB.substring(0, 4)) return titleA.localeCompare(titleB, 'ko', { numeric: true });
            if (a.release_date !== b.release_date) return a.release_date.localeCompare(b.release_date);
            return a.price - b.price;
        });
    } catch (error) {
        console.error("Search Error:", error);
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
