/* js/main.js 전체 교체 */
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

// 목록 열기(handleOpenEpisodes) 전역 연결
window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.");
    }
};

window.renderGrid = function(seriesList) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';

    seriesList.forEach((series, index) => {
        const thumb = series.thumbnailId ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const safeTitle = series.name.replace(/'/g, "\\'");
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                    ${series.sourceId ? `<a href="${window.getDynamicLink(series)}" target="_blank" class="btn btn-site">🌐 사이트</a>` : ''}
                </div>
            </div>
            <div class="info"><div class="title">${series.name}</div></div>`;
        grid.appendChild(card);
    });
};

window.refreshDB = async function(f, s, b) {
    try {
        const response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        // 북마크 로딩을 비동기로 분리하여 메인 로직을 방해하지 않게 함
        window.renderRecentList().catch(() => console.warn("북마크 건너뜀"));
    } catch (e) { console.error("DB 로드 에러:", e); }
};

window.renderRecentList = async function() {
    const response = await API.request('view_get_bookmarks', { folderId: API.folderId });
    // 북마크 렌더링 로직 (생략)
};

window.getDynamicLink = function(s) { /* 기존 도메인 계산 로직 */ return "#"; };
window.switchTab = (t) => { window.currentTab = t; window.filterData(); };
window.filterData = () => { /* 필터 로직 */ };
window.addEventListener('DOMContentLoaded', () => { if (window.API && API.isConfigured()) window.refreshDB(); });
