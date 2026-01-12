/**
 * 🚀 TokiSync Frontend - Final Symmetry Fix
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };
let allSeries = [];

// [핵심: 클릭 영역 로직 수정]
window.handleViewerClick = function(event) {
    // 1. 버튼 등 UI 클릭 시 종료
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon')) return;

    // 2. 다른 스크립트가 메뉴를 띄우지 못하게 완전히 차단
    event.preventDefault();
    event.stopImmediatePropagation();

    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    const viewerControls = document.getElementById('viewerControls');
    
    // 정확한 2:6:2 비율 (양옆 20%씩)
    const sideZone = screenWidth * 0.2; 

    if (clickX < sideZone) {
        // [왼쪽 영역] 무조건 이전 장 + 메뉴 숨김
        if (typeof navigateViewer === 'function') navigateViewer(-1);
        viewerControls.classList.remove('show'); 
    } 
    else if (clickX > screenWidth - sideZone) {
        // [오른쪽 영역] 무조건 다음 장 + 메뉴 숨김
        if (typeof navigateViewer === 'function') navigateViewer(1);
        viewerControls.classList.remove('show');
    } 
    else {
        // [가운데 60% 영역] 오직 여기서만 메뉴 토글
        viewerControls.classList.toggle('show');
    }
};

// [그리드 버튼 복구]
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
        const category = series.category || meta.category || 'Webtoon';
        const thumb = series.thumbnailId ? `https://lh3.googleusercontent.com/u/0/d/${series.thumbnailId}=s400` : NO_IMAGE_SVG;
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
                <div class="title">${series.name}</div>
                <div class="meta">
                    <span class="badge ${category}">${category}</span>
                    <span class="badge ongoing">${meta.status}</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function getDynamicLink(series) {
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    let cat = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
    let base = `https://newtoki${saved.newtoki}.com/webtoon/`;
    if (cat === "Novel") base = `https://booktoki${saved.booktoki}.com/novel/`;
    if (cat === "Manga") base = `https://manatoki${saved.manatoki}.net/comic/`;
    return series.sourceId ? base + series.sourceId : "#";
}

async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    if (!silent && loader) loader.style.display = 'flex';
    try {
        const response = await API.request('view_get_library', { folderId: forceId || API.folderId, refresh: bypassCache });
        renderGrid(Array.isArray(response) ? response : (response.list || []));
    } catch (e) { console.error(e); } finally { if(loader) loader.style.display = 'none'; }
}

window.changeFontSize = (d) => {
    const c = document.getElementById('viewerScrollContainer');
    if(c) c.style.fontSize = (parseInt(window.getComputedStyle(c).fontSize) + d) + "px";
};

window.changeLineHeight = (d) => {
    const c = document.getElementById('viewerScrollContainer');
    if(c) {
        let cur = parseFloat(window.getComputedStyle(c).line
