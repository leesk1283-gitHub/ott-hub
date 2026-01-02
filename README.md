# 🎬 OTT Hub (OTT 통합 검색 서비스)
- **바로가기**: https://leesk1283-github.github.io/ott-hub/

한국의 다양한 OTT 플랫폼(Netflix, Disney+, wavve, Watcha, TVING 등)의 영화 및 TV 시리즈 정보를 한눈에 검색하고 최저가 정보를 확인할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능
- **통합 검색**: 여러 OTT 플랫폼의 데이터를 통합하여 한 번의 검색으로 결과 확인
- **최저가 정보**: 구독(무료), 대여, 구매 등 가격 정보 및 서비스 타입 표시
- **다이렉트 링크**: 클릭 시 해당 OTT 작품 페이지 또는 검색 페이지로 바로 이동
- **OTT 필터링**: 내가 구독 중인 OTT 서비스만 골라서 결과 확인 가능
- **시각적 강조**: 검색 결과 요약 및 현재 상태를 직관적인 디자인으로 제공
- **반응형 디자인**: 모바일과 데스크톱 모두에 최적화된 사용자 경험

## 🛠️ 기술 스택
- **Frontend**: React (Vite), Framer Motion, Lucide React
- **Styling**: Vanilla CSS (Custom UI Design)
- **APIs**: The Movie Database (TMDB), Streaming Availability API
- **Deployment**: GitHub Pages

## 🚀 시작하기

### 설치
```bash
npm install
```

### 로컬 실행
```bash
npm run dev
```

### 배포
```bash
npm run deploy
```

## 📝 패치 및 보정
이 프로젝트는 API 데이터의 정확도를 높이기 위해 다음과 같은 수동 보정 레이어를 포함하고 있습니다:
- 잘못된 딥링크(예: 애플 TV 오매칭) 자동 필터링
- 특정 작품(예: 진격의 거인 시리즈 등)의 국내 OTT 데이터 보강
- 한국 시장에 특화된 검색어 기반 링크 생성 로직 적용
