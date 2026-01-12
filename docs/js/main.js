/* 🔴 사용자님이 주신 최신 ID 강제 적용 */
const LATEST_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";

// [1. 목록열기 강제 연결]
window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("모듈 로딩 중입니다. 1초만 기다렸다 다시 눌러주세요.");
    }
};

// [2. 그리드 렌더링 (드라이브 버튼 유지)]
window.renderGrid = function(seriesList) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    seriesList.forEach((series, index) => {
        const thumb = series.thumbnailId ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400` : "";
        const safeTitle = series.name.replace(/'/g, "\\'");
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn">📄 목록열기</button>
                    ${series.sourceId ? `<a href="${window.getDynamicLink(series)}" target="_blank" class="btn btn-site">🌐 사이트</a>` : ''}
                </div>
            </div>
            <div class="info"><div class="title">${series.name}</div></div>`;
        grid.appendChild(card);
    });
};

// [3. 데이터 로드 및 서버 ID 강제 갱신]
window.refreshDB = async function(f, s, b) {
    // 브라우저에 저장된 옛날 ID를 무시하고 코드로 강제 주입
    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    config.gasUrl = `https://script.google.com/macros/s/${LATEST_GAS_ID}/exec`;
    localStorage.setItem('tokisync_config', JSON.stringify(config));

    try {
        const response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        // 북마크 에러가 전체를 멈추지 않게 처리
        if (window.renderRecentList) window.renderRecentList().catch(() => {});
    } catch (e) { console.error("로드 실패:", e); }
};

window.getDynamicLink = (s) => { /* 도메인 로직 */ return "#"; };
window.addEventListener('DOMContentLoaded', () => { if (window.API) window.refreshDB(); });
