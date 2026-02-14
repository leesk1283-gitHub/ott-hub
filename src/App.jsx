import React, { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, Settings, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchOTT, getOTTIcon } from './services/ottService'

const ALL_OTT_LIST = [
    { id: 'Netflix', name: '넷플릭스' },
    { id: 'Disney+', name: '디즈니+' },
    { id: 'Tving', name: '티빙' },
    { id: 'Wavve', name: '웨이브' },
    { id: 'Watcha', name: '왓챠' },
    { id: 'Apple TV', name: '애플 TV' },
    { id: 'YouTube', name: '유튜브' },
    { id: 'Google Play', name: '구글 플레이' },
    { id: 'Naver SeriesOn', name: '네이버 시리즈온' },
    { id: 'Coupang Play', name: '쿠팡플레이' }
]

function App() {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState([])
    const [filteredResults, setFilteredResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [recentSearches, setRecentSearches] = useState(JSON.parse(localStorage.getItem('recent_searches')) || [])
    const [showSettings, setShowSettings] = useState(false)
    const [selectedOtts, setSelectedOtts] = useState(() => {
        const saved = localStorage.getItem('selected_otts');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 새롭게 추가된 OTT가 있으면 목록에 넣어줌 (예: 쿠팡플레이)
            const allIds = ALL_OTT_LIST.map(o => o.id);
            const missing = allIds.filter(id => !parsed.includes(id));
            if (missing.length > 0) {
                const updated = [...parsed, ...missing];
                localStorage.setItem('selected_otts', JSON.stringify(updated));
                return updated;
            }
            return parsed;
        }
        return ALL_OTT_LIST.map(o => o.id);
    })
    const [loadingDots, setLoadingDots] = useState('')
    const [recommendedKeywords, setRecommendedKeywords] = useState([])
    const [displaySearchTerm, setDisplaySearchTerm] = useState('')
    const inputRef = useRef(null)
    const resultsRef = useRef(null)

    useEffect(() => {
        const keywords = [
            '나홀로 집에', '오징어 게임', '진격의 거인', '귀멸의 칼날', '최악의 악',
            '씽', '파묘', '범죄도시4', '주토피아', '인사이드 아웃 2',
            '데드풀과 울버린', '서울의 봄', '엘리멘탈', '스파이더맨: 뉴 유니버스',
            '기생충', '곡성', '부산행', '극한직업', '미션 임파서블', '해리 포터'
        ];
        // Shuffle and take 8 random keywords
        const shuffled = [...keywords].sort(() => 0.5 - Math.random());
        setRecommendedKeywords(shuffled.slice(0, 8));
    }, []);

    useEffect(() => {
        let interval;
        if (isSearching) {
            interval = setInterval(() => {
                setLoadingDots(prev => (prev.length >= 3 ? '' : prev + '.'));
            }, 400);
        } else {
            setLoadingDots('');
        }
        return () => clearInterval(interval);
    }, [isSearching]);

    useEffect(() => {
        if (hasSearched && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [hasSearched, displaySearchTerm]);

    useEffect(() => {
        localStorage.setItem('recent_searches', JSON.stringify(recentSearches))
    }, [recentSearches])

    useEffect(() => {
        localStorage.setItem('selected_otts', JSON.stringify(selectedOtts))
        // Filter current results when selection changes
        filterResults(results)
    }, [selectedOtts])

    const filterResults = (allData) => {
        let filtered = allData;
        if (selectedOtts.length > 0) {
            filtered = allData.filter(item => {
                // 쿠팡플레이는 필터 설정과 상관없이 무조건 표시 (누락 방지)
                if (item.ott === 'Coupang Play') return true;
                return selectedOtts.some(ott => item.ott.toLowerCase().includes(ott.toLowerCase()));
            });
        }
        // Group by title
        const grouped = groupByTitle(filtered);
        setFilteredResults(grouped);
    }

    const groupByTitle = (data) => {
        const titleMap = new Map();
        data.forEach(item => {
            const key = item.title;
            if (!titleMap.has(key)) {
                titleMap.set(key, {
                    id: item.id,
                    title: item.title,
                    image: item.image,
                    description: item.description,
                    release_date: item.release_date,
                    ottServices: []
                });
            }
            titleMap.get(key).ottServices.push({
                ott: item.ott,
                price: item.price,
                priceText: item.priceText,
                link: item.link
            });
        });
        return Array.from(titleMap.values()).sort((a, b) => {
            // 개봉일 오름차순 정렬 (옛날 영화가 먼저 -> 시리즈 순서)
            if (!a.release_date) return 1;
            if (!b.release_date) return -1;
            return new Date(a.release_date) - new Date(b.release_date);
        });
    }

    const addToRecent = (term) => {
        if (!term.trim()) return
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
        setRecentSearches(updated)
    }

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        if (!searchTerm.trim()) return

        setIsSearching(true)
        setHasSearched(true)
        setDisplaySearchTerm(searchTerm)
        addToRecent(searchTerm)

        // Hide keyboard on mobile
        if (inputRef.current) inputRef.current.blur();

        try {
            const data = await searchOTT(searchTerm)
            setResults(data)
            filterResults(data)
        } catch (error) {
            console.error("Search failed:", error)
            setResults([])
            setFilteredResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleRecommend = (kw) => {
        setSearchTerm(kw)
        setIsSearching(true)
        setHasSearched(true)
        setDisplaySearchTerm(kw)
        addToRecent(kw)

        // Hide keyboard on mobile
        if (inputRef.current) inputRef.current.blur();
        setTimeout(async () => {
            const data = await searchOTT(kw)
            setResults(data)
            filterResults(data)
            setIsSearching(false)
        }, 100)
    }

    const toggleOtt = (id) => {
        setSelectedOtts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const removeRecent = (term) => {
        setRecentSearches(recentSearches.filter(s => s !== term))
    }

    const toggleAllOtts = () => {
        if (selectedOtts.length === ALL_OTT_LIST.length) {
            setSelectedOtts([])
        } else {
            setSelectedOtts(ALL_OTT_LIST.map(o => o.id))
        }
    }

    const handleClear = () => {
        setSearchTerm('')
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    return (
        <div className="main-wrapper">
            <div className="bg-glow-top" />
            <div className="bg-glow-bottom" />

            <div className={`container ${hasSearched ? 'top-view' : 'center-view'}`}>

                <header className="header-section" style={{ width: '100%', maxWidth: '700px', textAlign: 'center', marginBottom: hasSearched ? '10px' : '60px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.05em', margin: '0 0 10px 0', background: 'linear-gradient(to bottom, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            OTT HUB
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '18px' }}>모든 OTT를 관통하는 진짜 검색</p>
                    </div>

                    <div className="search-container">
                        <form onSubmit={handleSearch} className="search-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="나홀로 집에, 오징어 게임 등..."
                                className="search-input"
                            />
                            <div className="search-buttons">
                                {searchTerm && (
                                    <button type="button" onClick={handleClear} className="clear-btn">
                                        <X size={18} />
                                    </button>
                                )}
                                <button type="submit" disabled={isSearching} className="search-submit-btn">
                                    {isSearching ? <Loader2 size={20} className="loader" /> : <Search size={20} />}
                                </button>
                            </div>
                        </form>
                        <button className="settings-toggle" onClick={() => setShowSettings(true)}>
                            <Settings size={20} />
                        </button>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', fontSize: '14px', color: '#6b7280' }}
                        >
                            <span>추천:</span>
                            {recommendedKeywords.map(kw => (
                                <button
                                    key={kw}
                                    onClick={() => handleRecommend(kw)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}
                                >
                                    {kw}
                                </button>
                            ))}
                        </motion.div>

                        {recentSearches.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', fontSize: '14px', color: '#4b5563' }}
                            >
                                <span>최근 검색:</span>
                                {recentSearches.map(term => (
                                    <div key={term} className="recent-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                                        <button
                                            onClick={() => handleRecommend(term)}
                                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                                        >
                                            {term}
                                        </button>
                                        <button
                                            onClick={() => removeRecent(term)}
                                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </header>

                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                        >
                            <motion.div
                                className="settings-modal"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <h3 className="modal-title">검색 대상 OTT 설정</h3>
                                    <div style={{ marginRight: '16px' }}>
                                        <button className="modal-bulk-btn" onClick={toggleAllOtts}>
                                            {selectedOtts.length === ALL_OTT_LIST.length ? '전체 해제' : '전체 선택'}
                                        </button>
                                    </div>
                                    <button className="modal-close" onClick={() => setShowSettings(false)}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
                                    원하시는 OTT 서비스만 골라 결과를 확인할 수 있습니다.
                                </p>
                                <div className="ott-grid">
                                    {ALL_OTT_LIST.map(ott => (
                                        <div
                                            key={ott.id}
                                            className={`ott-option ${selectedOtts.includes(ott.id) ? 'selected' : ''}`}
                                            onClick={() => toggleOtt(ott.id)}
                                        >
                                            <div className="check-circle">
                                                {selectedOtts.includes(ott.id) && <Check size={12} color="white" strokeWidth={3} />}
                                            </div>
                                            <span className="ott-label">{ott.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="save-btn" onClick={() => setShowSettings(false)}>
                                    설정 완료
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {hasSearched && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="results-wrapper"
                            style={{ width: '100%' }}
                            ref={resultsRef}
                        >
                            <div className="results-header">
                                <div>
                                    <h2 className="results-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} color="#3b82f6" />
                                                <span>검색 중{loadingDots}</span>
                                            </>
                                        ) : (
                                            "검색 결과"
                                        )}
                                    </h2>
                                    <p className="results-subtitle">현재 한국 OTT 플랫폼 기준 최저가 순입니다.</p>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="ott-table">
                                    <colgroup>
                                        <col style={{ width: '50%' }} />
                                        <col style={{ width: '50%' }} />
                                    </colgroup>
                                    <tbody>
                                        {filteredResults.length > 0 ? (
                                            filteredResults.map((item, index) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    style={{ cursor: 'default' }}
                                                >
                                                    <td className="content-cell" style={{ width: '50%' }}>
                                                        <div className="content-wrapper">
                                                            <div className="poster-wrapper">
                                                                {item.image && (
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.title}
                                                                        className="poster-img"
                                                                        onLoad={(e) => {
                                                                            e.target.style.opacity = '1';
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            const fallback = e.target.parentElement.querySelector('.poster-fallback');
                                                                            if (fallback) fallback.style.display = 'flex';
                                                                        }}
                                                                        style={{ opacity: 0, transition: 'opacity 0.3s' }}
                                                                    />
                                                                )}
                                                                <div
                                                                    className="poster-fallback"
                                                                    style={{ display: !item.image ? 'flex' : 'none' }}
                                                                >
                                                                    <span className="fallback-title">{item.title}</span>
                                                                    <span className="fallback-icon">🎬</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-info">
                                                                <div className="main-title">{item.title}</div>
                                                                <div className="desc-text line-clamp-2">{item.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="ott-price-cell" style={{ width: '50%' }}>
                                                        <div className="ott-price-list">
                                                            {item.ottServices.map((svc, sidx) => {
                                                                const hasWarning = svc.priceText.includes('광고') ||
                                                                    svc.priceText.includes('제한') ||
                                                                    svc.priceText.includes('라이선스') ||
                                                                    svc.priceText.length > 35;
                                                                const finalPriceText = hasWarning ? '구독(무료)' : svc.priceText;
                                                                const finalNote = svc.note || (hasWarning ? '광고형 멤버십 제외' : null);

                                                                return (
                                                                    <div
                                                                        key={sidx}
                                                                        className="ott-price-row"
                                                                        onClick={() => svc.link && window.open(svc.link, '_blank')}
                                                                        style={{ cursor: svc.link ? 'pointer' : 'default' }}
                                                                    >
                                                                        <div className="ott-badge">
                                                                            <span style={{ fontSize: '18px' }}>{getOTTIcon(svc.ott)}</span>
                                                                            <span>{svc.ott}</span>
                                                                        </div>
                                                                        <div className={`price-tag ${svc.price === 0 ? 'free' : 'paid'}`}>
                                                                            {finalPriceText}
                                                                            {finalNote && <span className="price-note">{finalNote}</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            !isSearching && (
                                                <tr>
                                                    <td colSpan="2" style={{ padding: '80px', textAlign: 'center', color: '#4b5563' }}>
                                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔎</div>
                                                        <div>"{searchTerm}"에 대한 검색 결과가 없습니다.</div>
                                                        <p style={{ marginTop: '12px', fontSize: '14px' }}>필터 설정을 확인하시거나, 보다 넓은 검색을 위해 API 키를 등록해주세요.</p>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="modal-overlay"
                                onClick={() => setShowSettings(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="settings-modal"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="modal-header">
                                        <h3 className="modal-title">OTT 필터 설정</h3>
                                        <button className="modal-close" onClick={() => setShowSettings(false)}>
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <button
                                            onClick={toggleAllOtts}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                marginBottom: '10px'
                                            }}
                                        >
                                            {selectedOtts.length === ALL_OTT_LIST.length ? '전체 해제' : '전체 선택'}
                                        </button>
                                    </div>

                                    <div className="ott-grid">
                                        {ALL_OTT_LIST.map((ott) => (
                                            <div
                                                key={ott.id}
                                                className={`ott-option ${selectedOtts.includes(ott.id) ? 'selected' : ''}`}
                                                onClick={() => toggleOtt(ott.id)}
                                            >
                                                <div className="check-circle">
                                                    {selectedOtts.includes(ott.id) && <Check size={12} color="white" />}
                                                </div>
                                                <span className="ott-label">{ott.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="save-btn" onClick={() => setShowSettings(false)}>
                                        확인
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default App
