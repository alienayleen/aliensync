/**
 * 🚀 TokiSync - Final Absolute Fix (Wait & Bind)
 */
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
var DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };

window.allSeries = [];
window.currentTab = 'all';

// [1. 최근 본 목록 렌더링] - TypeError 방지를 위해 최상단 선언
window.renderRecentList = async function() {
    try {
        var response = await API.request('view_get_bookmarks', { folderId: API.folderId });
        var container = document.getElementById('recent-list');
        if (!container || !Array.isArray(response) || response.length === 0) return;

        container.innerHTML = '<h3>🕒 최근 본 작품</h3><div class="recent-grid"></div>';
        var grid = container.querySelector('.recent-grid');
        response.forEach(function(item) {
            var div = document.createElement('div');
            div.className = 'recent-card';
            div.onclick = function() { window.handleOpenEpisodes(item.seriesId, item.title.replace(/'/g, "\\'"), 0); };
            div.innerHTML = '<div class="recent-title" style="font-weight:bold;">' + item.title + '</div><div class="recent-ep">' + (item.episode || "회차미상") + '</div>';
            grid.appendChild(div);
        });
    } catch (e) {
        console.warn("북마크 로드 실패: 설정창의 GAS Deployment ID를 최신 버전으로 업데이트하세요.");
    }
};

// [2. 목록 열기 핸들러] - 라이브러리 함수가 준비될 때까지 기다림
window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    
    // 1. 즉시 실행 시도
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        // 2. 아직 로딩 전이면 0.5초만 대기 후 재시도
        console.log("목록 모듈 대기 중...");
        setTimeout(function() {
            if(typeof window.openEpisodeList === 'function') {
                window.openEpisodeList(id, name, index);
            } else {
                alert("뷰어 로딩이 지연되고 있습니다. 페이지를 새로고침(F5) 해주세요.");
            }
        }, 500);
    }
};

// [3. 그리드 렌더링 - 버튼 3개 복구]
window.renderGrid = function(seriesList) {
    window.allSeries = seriesList;
    var grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML = '';

    seriesList.forEach(function(series, index) {
        var meta = series.metadata || { category: 'Webtoon' };
        var category = series.category || meta.category || 'Webtoon';
        var thumb = series.thumbnailId ? "https://googleusercontent.com/profile/picture/0" + series.thumbnailId + "=s400" : NO_IMAGE_SVG;
        var safeTitle = series.name.replace(/'/g, "\\'");
        
        // 도메인 링크 계산
        var saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
        var domain = (category === "Novel") ? "booktoki" + saved.booktoki + ".com/novel/" : 
                     (category === "Manga") ? "manatoki" + saved.manatoki + ".net/comic/" : 
                     "newtoki" + saved.newtoki + ".com/webtoon/";
        var siteUrl = "https://" + domain + (series.sourceId || "");

        var card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-category', category);
        
        card.innerHTML = 
            '<div class="thumb-wrapper">' +
                '<img src="' + thumb + '" class="thumb" onerror="this.src=\'' + NO_IMAGE_SVG + '\'">' +
                '<div class="overlay">' +
                    '<a href="https://drive.google.com/drive/u/0/folders/' + series.id + '" target="_blank" class="btn btn-drive">📂 드라이브</a>' +
                    '<button onclick="window.handleOpenEpisodes(\'' + series.id + '\', \'' + safeTitle + '\', ' + index + ')" class="btn" style="background:#444; color:white;">📄 목록열기</button>' +
                    (series.sourceId ? '<a href="' + siteUrl + '" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>' : '') +
                '</div>' +
            '</div>' +
            '<div class="info">' +
                '<div class="title">' + series.name + '</div>' +
                '<div class="meta"><span class="badge ' + category + '">' + category + '</span></div>' +
            '</div>';
        grid.appendChild(card);
    });
    window.filterData();
};

// [4. 필수 기능 전역 공개]
window.switchTab = function(t) { window.currentTab = t; window.filterData(); };
window.filterData = function() {
    var q = (document.getElementById('search') ? document.getElementById('search').value.toLowerCase() : "");
    document.querySelectorAll('.card').forEach(function(card) {
        var title = card.querySelector('.title').innerText.toLowerCase();
        var cat = card.getAttribute('data-category');
        var match = (window.currentTab === 'all' || cat === window.currentTab) && title.indexOf(q) !== -1;
        card.style.display = match ? 'flex' : 'none';
    });
};

window.refreshDB = async function(f, s, b) {
    var loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';
    try {
        var response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        // 정의 확인 후 실행하여 TypeError 방지
        if (typeof window.renderRecentList === 'function') await window.renderRecentList();
    } finally {
        if(loader) loader.style.display = 'none';
    }
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

window.handleViewerClick = function(e) { /* 기존 클릭 로직 */ };

// 초기 로딩
window.addEventListener('DOMContentLoaded', function() { if (window.API && API.isConfigured()) window.refreshDB(); });
