/**
 * 🚀 TokiSync - Global Bridge Version
 */
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

window.allSeries = [];
window.currentTab = 'all';

// [1. 목록 열기 핸들러] - index.js의 함수를 호출
window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        console.warn("⚠️ openEpisodeList 모듈 로딩 대기 중...");
        setTimeout(() => {
            if (window.openEpisodeList) window.openEpisodeList(id, name, index);
            else alert("목록 모듈이 로드되지 않았습니다. index.js 하단 설정을 확인하세요.");
        }, 500);
    }
};

// [2. 사이트 링크 계산]
window.getDynamicLink = function(series) {
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || { newtoki: '469', manatoki: '469', booktoki: '469' };
    const cat = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
    const num = (cat === "Novel") ? saved.booktoki : (cat === "Manga" ? saved.manatoki : saved.newtoki);
    const base = (cat === "Novel") ? "booktoki" + num + ".com/novel/" : (cat === "Manga") ? "manatoki" + num + ".net/comic/" : "newtoki" + num + ".com/webtoon/";
    return "https://" + base + (series.sourceId || "");
};

// [3. 그리드 렌더링]
window.renderGrid = function(seriesList) {
    window.allSeries = seriesList;
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';

    seriesList.forEach((series, index) => {
        const category = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
        const thumb = series.thumbnailId ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const safeTitle = series.name.replace(/'/g, "\\'");
        
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-category', category);
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                    ${series.sourceId ? `<a href="${window.getDynamicLink(series)}" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>` : ''}
                </div>
            </div>
            <div class="info"><div class="title">${series.name}</div></div>`;
        grid.appendChild(card);
    });
};

// [4. 분류 탭 및 검색]
window.switchTab = function(t) { window.currentTab = t; window.filterData(); };
window.filterData = function() {
    const query = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('.title').innerText.toLowerCase();
        const cat = card.getAttribute('data-category');
        const match = (window.currentTab === 'all' || cat === window.currentTab) && title.includes(query);
        card.style.display = match ? 'flex' : 'none';
    });
};

// [5. 최근 본 목록 & 북마크]
window.renderRecentList = async function() {
    try {
        const response = await API.request('view_get_bookmarks', { folderId: API.folderId });
        const container = document.getElementById('recent-list');
        if (!container || !Array.isArray(response) || response.length === 0) return;

        container.innerHTML = '<h3>🕒 최근 본 작품</h3><div class="recent-grid"></div>';
        const grid = container.querySelector('.recent-grid');
        response.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-card';
            div.onclick = () => window.handleOpenEpisodes(item.seriesId, item.title.replace(/'/g, "\\'"), 0);
            div.innerHTML = `<div class="recent-title"><b>${item.title}</b></div><div class="recent-ep">${item.episode || "회차미상"}</div>`;
            grid.appendChild(div);
        });
    } catch (e) { console.warn("북마크 로드 실패"); }
};

window.saveCurrentBookmark = async function() {
    if (!window.currentSeriesId) return;
    try {
        await API.request('view_save_bookmark', {
            seriesId: window.currentSeriesId, title: window.currentSeriesTitle,
            episode: window.currentEpisodeName || "읽는 중", point: "1P", folderId: API.folderId
        });
        if(window.showToast) window.showToast("✅ 저장 완료");
        window.renderRecentList();
    } catch (e) { console.error(e); }
};

// 초기 실행
/* main.js 내 수정 */
window.refreshDB = async function(f, s, b) {
    var loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';
    try {
        var response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        
        // 🔴 북마크 로딩 실패가 전체를 멈추지 않게 try-catch로 감쌉니다.
        try {
            if (typeof window.renderRecentList === 'function') await window.renderRecentList();
        } catch (bookmarkErr) {
            console.warn("북마크 초기 로드 건너뜀:", bookmarkErr);
        }
    } catch (e) {
        console.error("라이브러리 로드 실패:", e);
    } finally {
        if(loader) loader.style.display = 'none';
    }
};

window.addEventListener('DOMContentLoaded', () => { if (window.API && API.isConfigured()) window.refreshDB(); });
