/* js/main.js 전체를 이 코드로 다시 덮어쓰세요 */

var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
var DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };

window.allSeries = [];
window.currentSeriesId = null;
window.currentSeriesTitle = "";
window.currentEpisodeName = "";

// [1. 클릭 핸들러: 이동 영역과 메뉴 영역 엄격 분리]
window.handleViewerClick = function(event) {
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon')) return;
    if(event.stopImmediatePropagation) event.stopImmediatePropagation();

    var clickX = event.clientX;
    var screenWidth = window.innerWidth;
    var viewerControls = document.getElementById('viewerControls');
    var sideZone = screenWidth * 0.2; 

    if (clickX < sideZone) {
        if (window.navigateViewer) window.navigateViewer(-1);
        if (viewerControls) viewerControls.classList.remove('show');
    } else if (clickX > screenWidth - sideZone) {
        if (window.navigateViewer) window.navigateViewer(1);
        if (viewerControls) viewerControls.classList.remove('show');
    } else {
        if (viewerControls) viewerControls.classList.toggle('show');
    }
};

// [2. 그리드 렌더링 - 목록 열기 버튼 로직 복구]
window.renderGrid = function(seriesList) {
    window.allSeries = seriesList;
    var grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML = '';

    if (!seriesList || seriesList.length === 0) {
        grid.innerHTML = '<div class="no-data">작품이 없습니다.</div>';
        return;
    }

    seriesList.forEach(function(series, index) {
        var meta = series.metadata || { status: 'Unknown', authors: [], category: 'Webtoon' };
        var category = series.category || meta.category || 'Webtoon';
        var thumb = series.thumbnailId ? "https://googleusercontent.com/profile/picture/0" + series.thumbnailId + "=s400" : NO_IMAGE_SVG;
        var safeTitle = series.name.replace(/'/g, "\\'");
        var dynamicUrl = window.getDynamicLink(series);

        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = 
            '<div class="thumb-wrapper">' +
                '<img src="' + thumb + '" class="thumb" onerror="this.src=\'' + NO_IMAGE_SVG + '\'">' +
                '<div class="overlay">' +
                    '<a href="https://drive.google.com/drive/u/0/folders/' + series.id + '" target="_blank" class="btn btn-drive">📂 드라이브</a>' +
                    /* 아래 onclick 부분이 목록 열기 핵심입니다 */
                    '<button onclick="window.handleOpenEpisodes(\'' + series.id + '\', \'' + safeTitle + '\', ' + index + ')" class="btn" style="background:#444; color:white;">📄 목록열기</button>' +
                    (series.sourceId ? '<a href="' + dynamicUrl + '" target="_blank" class="btn btn-site" style="background:#00d084; color:black;">🌐 사이트</a>' : '') +
                '</div>' +
            '</div>' +
            '<div class="info">' +
                '<div class="title">' + series.name + '</div>' +
                '<div class="meta">' +
                    '<span class="badge ' + category + '">' + category + '</span>' +
                    '<span class="badge ongoing">' + meta.status + '</span>' +
                '</div>' +
            '</div>';
        grid.appendChild(card);
    });
};

window.handleOpenEpisodes = function(id, name, index) {
    window.currentSeriesId = id;
    window.currentSeriesTitle = name;
    // index.js에서 정의된 원래의 목록 열기 함수를 호출합니다.
    if (window.openEpisodeList) {
        window.openEpisodeList(id, name, index);
    } else {
        console.error("openEpisodeList 함수를 찾을 수 없습니다.");
    }
};

// [3. 최근 본 작품 & 북마크]
window.renderRecentList = async function() {
    try {
        var response = await API.request('view_get_bookmarks', { folderId: API.folderId });
        var recent = Array.isArray(response) ? response : [];
        var container = document.getElementById('recent-list');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = '<h3>🕒 최근 본 작품</h3><div class="recent-grid"></div>';
        var grid = container.querySelector('.recent-grid');
        recent.forEach(function(item) {
            var div = document.createElement('div');
            div.className = 'recent-card';
            var safeItemTitle = item.title.replace(/'/g, "\\'");
            div.onclick = function() { window.handleOpenEpisodes(item.seriesId, safeItemTitle, 0); };
            div.innerHTML = 
                '<div class="recent-title">' + item.title + '</div>' +
                '<div class="recent-ep">' + (item.episode || "회차미상") + ' (' + item.point + ')</div>';
            grid.appendChild(div);
        });
    } catch (e) { console.warn("북마크 목록 로드 실패"); }
};

window.saveCurrentBookmark = async function() {
    if (!window.currentSeriesId) return;
    var scrollContainer = document.getElementById('viewerScrollContainer');
    var point = (document.getElementById('sliderCurrent') ? document.getElementById('sliderCurrent').innerText : "1") + "P";
    
    if (scrollContainer && scrollContainer.style.display === 'block') {
        var pct = Math.round((scrollContainer.scrollTop / (scrollContainer.scrollHeight - scrollContainer.clientHeight)) * 100);
        point = pct + "%";
    }

    try {
        if(window.showToast) window.showToast("💾 드라이브 저장 중...");
        await API.request('view_save_bookmark', {
            seriesId: window.currentSeriesId,
            title: window.currentSeriesTitle,
            episode: window.currentEpisodeName || "읽는 중",
            point: point,
            folderId: API.folderId
        });
        if(window.showToast) window.showToast("✅ 저장 완료!");
        window.renderRecentList();
    } catch (e) { console.error(e); }
};

window.getDynamicLink = function(series) {
    var saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    var cat = series.category || (series.metadata ? series.metadata.category : 'Webtoon');
    var domain = (cat === "Novel") ? "booktoki" + saved.booktoki + ".com/novel/" : 
                 (cat === "Manga") ? "manatoki" + saved.manatoki + ".net/comic/" : 
                 "newtoki" + saved.newtoki + ".com/webtoon/";
    return "https://" + domain + series.sourceId;
};

window.refreshDB = async function(forceId, silent, bypassCache) {
    var loader = document.getElementById('pageLoader');
    if (!silent && loader) loader.style.display = 'flex';
    try {
        var response = await API.request('view_get_library', { folderId: forceId || API.folderId, refresh: bypassCache });
        window.renderGrid(Array.isArray(response) ? response : (response.list || []));
        window.renderRecentList();
    } catch (e) { console.error(e); }
    finally { if(loader) loader.style.display = 'none'; }
};

// 유틸리티
window.changeFontSize = function(d) {
    var c = document.getElementById('viewerScrollContainer');
    if(c) c.style.fontSize = (parseInt(window.getComputedStyle(c).fontSize) + d) + "px";
};
window.changeLineHeight = function(d) {
    var c = document.getElementById('viewerScrollContainer');
    if(c) {
        var cur = parseFloat(window.getComputedStyle(c).lineHeight) / parseInt(window.getComputedStyle(c).fontSize) || 1.6;
        c.style.lineHeight = (cur + d);
    }
};

window.addEventListener('DOMContentLoaded', function() {
    if (typeof API !== 'undefined' && API.isConfigured()) window.refreshDB();
});
