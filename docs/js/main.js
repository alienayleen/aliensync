/**
 * 🚀 TokiSync Frontend - Main Controller (Updated)
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };
const VIEWER_VERSION = "v1.1.3";
window.TOKI_VIEWER_VERSION = VIEWER_VERSION;

let allSeries = [];
let currentTab = 'all';

// [초기화]
window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener("message", handleMessage, false);
    const el = document.getElementById('viewerVersionDisplay');
    if(el) el.innerText = `Viewer Version: ${VIEWER_VERSION}`;
    
    if (API.isConfigured()) {
        showToast("🚀 연결 중...");
        refreshDB(null, true);
        loadDomains();
    } else {
        setTimeout(() => {
            if (!API.isConfigured()) document.getElementById('configModal').style.display = 'flex';
            else refreshDB(null, true);
            loadDomains();
        }, 1000);
    }
});

function handleMessage(event) {
    if (event.data.type === 'TOKI_CONFIG') {
        const { url, folderId } = event.data;
        if (url && folderId) {
            API.setConfig(url, folderId);
            document.getElementById('configModal').style.display = 'none';
            showToast("⚡️ 자동 설정 완료!");
            refreshDB();
        }
    }
}

// [1. 클릭 핸들러 수정] - 클래스 이름을 .show로 통일
window.handleViewerClick = function(event) {
    // 버튼이나 컨트롤 영역을 누른 거라면 메뉴를 끄지 않음
    if (event.target.closest('.viewer-controls') || event.target.closest('.btn-icon')) {
        return;
    }

    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    const viewerControls = document.getElementById('viewerControls');
    
    // 중앙 40% 영역 계산
    const sideZoneWidth = screenWidth * 0.3; 

    if (clickX < sideZoneWidth) {
        // 왼쪽 30%: 이전 페이지 이동만 함 (메뉴 안 건드림)
        if (typeof navigateViewer === 'function') navigateViewer(-1);
    } else if (clickX > screenWidth - sideZoneWidth) {
        // 오른쪽 30%: 다음 페이지 이동만 함 (메뉴 안 건드림)
        if (typeof navigateViewer === 'function') navigateViewer(1);
    } else {
        // 가운데 40%: 메뉴(검정 바) 토글
        // 기존에 .show가 있으면 제거, 없으면 추가
        viewerControls.classList.toggle('show');
    }
};

// [2. 글자 크기 조절 수정] - 텍스트 모드일 때만 작동하도록 강제
window.changeFontSize = function(delta) {
    // 텍스트가 들어가는 모든 가능한 컨테이너를 타겟팅
    const containers = [
        document.getElementById('viewerScrollContainer'),
        document.querySelector('.inner-content'),
        document.querySelector('.epub-content')
    ];

    containers.forEach(container => {
        if (container) {
            let curSize = parseInt(window.getComputedStyle(container).fontSize) || 18;
            let newSize = curSize + delta;
            
            // 12px ~ 50px 사이로 제한
            if (newSize < 12) newSize = 12;
            if (newSize > 50) newSize = 50;
            
            container.style.fontSize = newSize + 'px';
            container.style.setProperty('font-size', newSize + 'px', 'important');
        }
    });
    
    if (typeof showToast === 'function') showToast(`글자 크기 조절됨`);
};
// [데이터 로드]
async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    if (!silent && loader) loader.style.display = 'flex';

    try {
        let list = [];
        const payload = { folderId: forceId || API.folderId };
        if (bypassCache) payload.bypassCache = true;

        const response = await API.request('view_get_library', payload);
        list = Array.isArray(response) ? response : (response.list || []);
        
        renderGrid(list);
        if (!silent) showToast("📚 업데이트 완료");
    } catch (e) {
        showToast(`❌ 로드 실패: ${e.message}`);
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

// [그리드 렌더링]
function renderGrid(seriesList) {
    allSeries = seriesList;
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    if (!allSeries.length) {
        grid.innerHTML = '<div class="no-data">작품이 없습니다.</div>';
        return;
    }

    allSeries.forEach((series, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        const meta = series.metadata || { authors: [], status: 'Unknown' };
        let thumb = series.thumbnailId ? `https://lh3.googleusercontent.com/d/$${series.thumbnailId}=s400` : NO_IMAGE_SVG;

        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <button onclick="openEpisodeList('${series.id}', '${series.name}', ${index})" class="btn">📄 목록</button>
                </div>
            </div>
            <div class="info">
                <div class="title">${series.name}</div>
                <div class="meta"><span class="badge">${meta.status}</span></div>
            </div>`;
        grid.appendChild(card);
    });
}

// [기타 기능들]
function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast show';
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); }, 2000);
}

function filterData() {
    const query = document.getElementById('search').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
        const name = allSeries[i].name.toLowerCase();
        card.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

function toggleSettings() {
    const el = document.getElementById('domainPanel');
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function loadDomains() {
    const elFolder = document.getElementById('setting_folderId');
    if (API.folderId && elFolder) elFolder.value = API.folderId;
}

// 전역 노출
window.refreshDB = refreshDB;
window.toggleSettings = toggleSettings;
window.filterData = filterData;
