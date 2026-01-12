/**
 * 🚀 TokiSync - Logic & Syntax Integrated Fix
 */
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

window.allSeries = [];
window.currentTab = 'all'; // 현재 선택된 탭 상태

// [1. 분류 탭 기능 - HTML의 switchTab()과 연결]
window.switchTab = function(tabName) {
    window.currentTab = tabName;
    
    // 탭 버튼 활성화 스타일 변경
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        // 버튼의 onclick 속성에 해당 탭 이름이 있는지 확인
        if(btn.outerHTML.indexOf("'" + tabName + "'") !== -1) btn.classList.add('active');
    });
    
    window.filterData(); // 필터링 실행
};

// [2. 필터링 로직 - 검색어와 탭 중복 적용]
window.filterData = function() {
    var query = document.getElementById('search').value.toLowerCase();
    var cards = document.querySelectorAll('.card');
    
    cards.forEach(function(card) {
        var title = card.querySelector('.title').innerText.toLowerCase();
        var category = card.getAttribute('data-category'); // 렌더링 시 심어둔 카테고리
        
        var matchTab = (window.currentTab === 'all' || category === window.currentTab);
        var matchSearch = title.indexOf(query) !== -1;
        
        card.style.display = (matchTab && matchSearch) ? 'flex' : 'none';
    });
};

// [3. 그리드 렌더링 - 목록열기 기능 복구]
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

        var card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-category', category); // 필터링용 데이터 심기
        
        card.innerHTML = 
            '<div class="thumb-wrapper">' +
                '<img src="' + thumb + '" class="thumb" onerror="this.src=\'' + NO_IMAGE_SVG + '\'">' +
                '<div class="overlay">' +
                    '<a href="https://drive.google.com/drive/u/0/folders/' + series.id + '" target="_blank" class="btn btn-drive">📂 드라이브</a>' +
                    '<button onclick="window.handleOpenEpisodes(\'' + series.id + '\', \'' + safeTitle + '\', ' + index + ')" class="btn" style="background:#444; color:white;">📄 목록열기</button>' +
                '</div>' +
            '</div>' +
            '<div class="info">' +
                '<div class="title">' + series.name + '</div>' +
                '<div class="meta"><span class="badge ' + category + '">' + category + '</span></div>' +
            '</div>';
        grid.appendChild(card);
    });
    window.filterData(); // 초기 필터 적용
};

window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    // index.js에 정의된 openEpisodeList를 호출
    if (window.openEpisodeList) window.openEpisodeList(id, name, index);
};

// [4. 북마크 및 최근 목록]
window.renderRecentList = async function() {
    try {
        var response = await API.request('view_get_bookmarks', { folderId: API.folderId });
        var container = document.getElementById('recent-list');
        if (!container || !Array.isArray(response)) return;

        container.innerHTML = '<h3>🕒 최근 본 작품</h3><div class="recent-grid"></div>';
        response.forEach(function(item) {
            var div = document.createElement('div');
            div.className = 'recent-card';
            div.onclick = function() { window.handleOpenEpisodes(item.seriesId, item.title.replace(/'/g, "\\'"), 0); };
            div.innerHTML = '<div class="recent-title">' + item.title + '</div><div class="recent-ep">' + (item.episode || "회차미상") + '</div>';
            div.querySelector('.recent-title').style.fontWeight = 'bold';
            container.querySelector('.recent-grid').appendChild(div);
        });
    } catch (e) { console.warn("Recent list fail"); }
};

window.saveCurrentBookmark = async function() {
    if (!window.currentSeriesId) return;
    var point = (document.getElementById('sliderCurrent') ? document.getElementById('sliderCurrent').innerText : "1") + "P";
    try {
        await API.request('view_save_bookmark', {
            seriesId: window.currentSeriesId, title: window.currentSeriesTitle,
            episode: window.currentEpisodeName || "읽는 중", point: point, folderId: API.folderId
        });
        if(window.showToast) window.showToast("✅ 북마크 저장");
        window.renderRecentList();
    } catch (e) { console.error(e); }
};

window.refreshDB = async function(f, s, b) {
    var loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';
    try {
        var response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        window.renderRecentList();
    } finally { if(loader) loader.style.display = 'none'; }
};

window.addEventListener('DOMContentLoaded', function() { if (API.isConfigured()) window.refreshDB(); });

// 파일 맨 하단에 추가
window.switchTab = switchTab;
window.filterData = filterData;
window.handleOpenEpisodes = handleOpenEpisodes;
window.saveCurrentBookmark = saveCurrentBookmark;
window.handleViewerClick = handleViewerClick;
