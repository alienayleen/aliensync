/**
 * 🚀 TokiSync Frontend - Syntax Error Fixed Version
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };

window.allSeries = [];
window.currentSeriesId = null;
window.currentSeriesTitle = "";
window.currentEpisodeName = "";

// [1. 클릭 핸들러]
window.handleViewerClick = function(event) {
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon')) return;
    
    // 타 스크립트 간섭 방지
    if(event.stopImmediatePropagation) event.stopImmediatePropagation();

    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    const viewerControls = document.getElementById('viewerControls');
    const sideZone = screenWidth * 0.2; 

    if (clickX < sideZone) {
        if (typeof navigateViewer === 'function') navigateViewer(-1);
        if (viewerControls) viewerControls.classList.remove('show');
    } else if (clickX > screenWidth - sideZone) {
        if (typeof navigateViewer === 'function') navigateViewer(1);
        if (viewerControls) viewerControls.classList.remove('show');
    } else {
        if (viewerControls) viewerControls.classList.toggle('show');
    }
};

// [2. 그리드 렌더링 - 버튼/분류 완벽 복구]
window.renderGrid = function(seriesList) {
    window.allSeries = seriesList;
    const grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML = '';

    if (!seriesList || seriesList.length === 0) {
        grid.innerHTML = '<div class="no-data">작품이 없습니다.</div>';
        return;
    }

    seriesList.forEach((series, index) => {
        const meta = series.metadata || { status: 'Unknown', authors: [], category: 'Webtoon' };
        const category = series.category || meta.category || 'Webtoon';
        
        // 썸네일 ID 주소의 $ 표시 오타 수정
        const thumb = series.thumbnailId ? "https://googleusercontent.com/profile/picture/0" + series.thumbnailId + "=s400" : NO_IMAGE_SVG;
        
        // 따옴표 오류 방지를 위한 처리
        const safeTitle = series.name.replace(/'/g, "\\'");

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                    ${series.sourceId ? `<a href="${getDynamicLink(series)}" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>` : ''}
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
};

window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    if (typeof openEpisodeList === 'function') openEpisodeList(id, name, index);
};

// [3. 최근 본 작품 & 북마크]
window.renderRecentList = async function() {
    try {
        const response = await API.request('view_get_bookmarks', { folderId: API.folderId });
        const recent = Array.isArray(response) ? response : [];
        const container = document.getElementById('recent-list');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = '<h3>🕒 최근 본 작품</h3><div class="recent-grid"></div>';
        const grid = container.querySelector('.recent-grid');
        recent.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-card';
            const safeItemTitle = item.title.replace(/'/g, "\\'");
            div.onclick = () => window.handleOpenEpisodes(item.seriesId, safeItemTitle, 0);
            div.innerHTML = `
                <div class="recent-title">${item.title}</div>
                <div class="recent-ep">${item.episode} (${item.point})</div>
            `;
            grid.appendChild(div);
        });
    } catch (e) { console.warn("Recent list failed"); }
};

window.saveCurrentBookmark = async function() {
    if (!window.currentSeriesId) return;
    const scrollContainer = document.getElementById('viewerScrollContainer');
    let point = document.getElementById
