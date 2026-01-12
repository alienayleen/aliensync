/**
 * 🚀 TokiSync Frontend - Main Controller (Final Fixed)
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };
let allSeries = [];
let currentTab = 'all';

// [초기화]
window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('viewerVersionDisplay');
    if(el) el.innerText = `Viewer Version: v1.1.3 (Fixed)`;
    if (API.isConfigured()) {
        refreshDB(null, true);
        loadDomains();
    }
});

// [1. 클릭 핸들러: 중앙 60% 메뉴, 양옆 20% 이동]
window.handleViewerClick = function(event) {
    // 버튼이나 컨트롤 영역 클릭은 무시
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon')) return;

    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    const viewerControls = document.getElementById('viewerControls');
    
    // 영역 설정 (양끝 20%씩, 중앙 60%)
    const sideZoneWidth = screenWidth * 0.2; 

    if (clickX < sideZoneWidth) {
        // 왼쪽 20%: 이전 페이지
        if (typeof navigateViewer === 'function') navigateViewer(-1);
    } else if (clickX > screenWidth - sideZoneWidth) {
        // 오른쪽 20%: 다음 페이지
        if (typeof navigateViewer === 'function') navigateViewer(1);
    } else {
        // 중앙 60%: 메뉴 토글
        viewerControls.classList.toggle('show');
    }
};

// [2. 글자 크기 조절]
window.changeFontSize = function(delta) {
    const container = document.getElementById('viewerScrollContainer');
    if (!container) return;
    let curSize = parseInt(window.getComputedStyle(container).fontSize) || 18;
    let newSize = Math.max(12, Math.min(50, curSize + delta));
    container.style.fontSize = newSize + 'px';
};

// [3. 그리드 렌더링: 버튼 및 정보 복구]
function renderGrid(seriesList) {
    allSeries = seriesList;
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    if (!allSeries.length) {
        grid.innerHTML = '<div class="no-data">작품이 없습니다.</div>';
        return;
    }

    allSeries.forEach((series, index) => {
        const meta = series.metadata || { status: 'Unknown', authors: [], category: 'Webtoon' };
        const authors = meta.authors || [];
        const thumb = series.thumbnailId ? `https://lh3.googleusercontent.com/d/$${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const dynamicUrl = getDynamicLink(series);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="openEpisodeList('${series.id}', '${series.name}', ${index})" class="btn" style="background:#444; color:white;">📄 목록</button>
                    ${series.sourceId ? `<a href="${dynamicUrl}" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>` : ''}
                </div>
            </div>
            <div class="info">
                <div class="title" title="${series.name}">${series.name}</div>
                <div class="author">${authors.join(', ') || '작가 미상'}</div>
                <div class="meta">
                    <span class="badge ${meta.status === 'COMPLETED' ? 'completed' : 'ongoing'}">${meta.status}</span>
                    <span class="count">${series.booksCount || 0}권</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// [4. 데이터 로드 및 유틸리티]
async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    if (!silent && loader) loader.style.display = 'flex';
    try {
        const payload = { folderId: forceId || API.folderId };
        if (bypassCache) payload.refresh = true;
        const response = await API.request('view_get_library', payload);
        const list = Array.isArray(response) ? response : (response.list || []);
        renderGrid(list);
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

function loadDomains() {
    const elFolder = document.getElementById('setting_folderId');
    if (API.folderId && elFolder) elFolder.value = API.folderId;
}

window.refreshDB = refreshDB;
window.switchTab = (tab) => { currentTab = tab; filterData(); };
window.filterData = () => {
    const q = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('.card').forEach((card, i) => {
        const name = allSeries[i].name.toLowerCase();
        card.style.display = name.includes(q) ? 'flex' : 'none';
    });
};
