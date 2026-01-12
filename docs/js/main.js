/**
 * 🚀 TokiSync Frontend - Main Controller (Bug Fix & Restore)
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };
let allSeries = [];
window.currentSeriesId = null; 
window.currentEpisodeName = null;

// [1. 클릭 핸들러: 영역 엄격 구분]
window.handleViewerClick = function(event) {
    // UI 요소 클릭 시 로직 중단
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon') || event.target.closest('.modal')) return;

    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    const viewerControls = document.getElementById('viewerControls');
    
    // 양 끝 20%는 페이지만 넘김, 중앙 60%만 메뉴 토글
    const sideZone = screenWidth * 0.2; 

    if (clickX < sideZone) {
        if (typeof navigateViewer === 'function') navigateViewer(-1);
    } else if (clickX > screenWidth - sideZone) {
        if (typeof navigateViewer === 'function') navigateViewer(1);
    } else {
        // 중앙 영역 클릭시에만 메뉴 클래스 토글
        viewerControls.classList.toggle('show');
    }
};

// [2. 그리드 렌더링: 카테고리/드라이브/사이트 버튼 완벽 복구]
function renderGrid(seriesList) {
    allSeries = seriesList;
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    if (!allSeries || allSeries.length === 0) {
        grid.innerHTML = '<div class="no-data">작품이 없습니다.</div>';
        return;
    }

    allSeries.forEach((series, index) => {
        const meta = series.metadata || { status: 'Unknown', authors: [], category: 'Webtoon' };
        const authors = meta.authors || [];
        const category = series.category || meta.category || 'Webtoon';
        const thumb = series.thumbnailId ? `https://lh3.googleusercontent.com/d/${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const dynamicUrl = getDynamicLink(series);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="openEpisodeList('${series.id}', '${series.name}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                    ${series.sourceId ? `<a href="${dynamicUrl}" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>` : ''}
                </div>
            </div>
            <div class="info">
                <div class="title" title="${series.name}">${series.name}</div>
                <div class="author">${authors.join(', ') || '작가 미상'}</div>
                <div class="meta">
                    <span class="badge ${category}">${category}</span>
                    <span class="badge ${meta.status === 'COMPLETED' ? 'completed' : 'ongoing'}">${meta.status}</span>
                    <span class="count">${series.booksCount || 0}권</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// [3. 글자 크기 및 유틸리티]
window.changeFontSize = function(delta) {
    const container = document.getElementById('viewerScrollContainer');
    if (!container) return;
    let curSize = parseInt(window.getComputedStyle(container).fontSize) || 18;
    container.style.fontSize = Math.max(12, Math.min(50, curSize + delta)) + 'px';
};

async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    if (!silent && loader) loader.style.display = 'flex';
    try {
        const payload = { folderId: forceId || API.folderId };
        if (bypassCache) payload.refresh = true;
        const response = await API.request('view_get_library', payload);
        renderGrid(Array.isArray(response) ? response : (response.list || []));
    } catch (e) { console.error(e); } finally { if(loader) loader.style.display = 'none'; }
}

function getDynamicLink(series) {
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    let cat = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
    let base = `https://newtoki${saved.newtoki}.com/webtoon/`;
    if (cat === "Novel") base = `https://booktoki${saved.booktoki}.com/novel/`;
    if (cat === "Manga") base = `https://manatoki${saved.manatoki}.net/comic/`;
    return series.sourceId ? base + series.sourceId : "#";
}

// 북마크 저장 기능 (요청하신 기능 추가)
window.saveCurrentBookmark = async function() {
    const payload = {
        type: "view_save_bookmark",
        seriesId: window.currentSeriesId,
        title: document.getElementById('viewerTitle').innerText,
        episode: window.currentEpisodeName || "1화",
        point: document.getElementById('sliderCurrent').innerText + " Page",
        folderId: API.folderId
    };
    try {
        showToast("💾 저장 중...");
        await API.request('view_save_bookmark', payload);
        showToast("✅ 북마크 완료!");
    } catch (e) { showToast("❌ 실패"); }
};

window.refreshDB = refreshDB;
window.loadDomains = () => { /* 초기 설정 로드 */ };
