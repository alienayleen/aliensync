/**
 * 🚀 TokiSync - Final Integrated Fix
 */
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
var DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };

window.allSeries = [];
window.currentTab = 'all';

// [1. 사이트 링크 복구 로직]
window.getDynamicLink = function(series) {
    var saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    var cat = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
    var domain = (cat === "Novel") ? "booktoki" + saved.booktoki + ".com/novel/" : 
                 (cat === "Manga") ? "manatoki" + saved.manatoki + ".net/comic/" : 
                 "newtoki" + saved.newtoki + ".com/webtoon/";
    return "https://" + domain + (series.sourceId || "");
};

// [2. 그리드 렌더링 - 버튼 3개 복구]
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
        var siteUrl = window.getDynamicLink(series);

        var card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-category', category);
        
        card.innerHTML = 
            '<div class="thumb-wrapper">' +
                '<img src="' + thumb + '" class="thumb" onerror="this.src=\'' + NO_IMAGE_SVG + '\'">' +
                '<div class="overlay">' +
                    '<a href="https://drive.google.com/drive/u/0/folders/' + series.id + '" target="_blank" class="btn btn-drive">📂 드라이브</a>' +
                    /* 목록열기 함수 연결 */
                    '<button onclick="window.handleOpenEpisodes(\'' + series.id + '\', \'' + safeTitle + '\', ' + index + ')" class="btn" style="background:#444; color:white;">📄 목록열기</button>' +
                    /* 사이트 버튼 복구 */
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

// [3. 목록 열기 기능 전역 노출]
window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    // index.js에서 정의된 원래 함수 호출
    if (window.openEpisodeList) {
        window.openEpisodeList(id, name, index);
    } else {
        console.error("openEpisodeList not found");
    }
};

// [4. 기타 필수 함수 등록]
window.switchTab = function(tab) { window.currentTab = tab; window.filterData(); };
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
        window.renderRecentList();
    } finally { if(loader) loader.style.display = 'none'; }
};

window.addEventListener('DOMContentLoaded', function() { if (window.API && API.isConfigured()) window.refreshDB(); });
