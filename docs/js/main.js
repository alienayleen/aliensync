/**
 * 🚀 TokiSync Frontend - Main Controller (FULL RESTORED)
 */

const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
const MY_FOLDER_ID = "1pqN828teolRePME7XmXBZsjCwRBmWrts";

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

const DEFAULT_DOMAINS = { newtoki: '469', manatoki: '469', booktoki: '469' };
const VIEWER_VERSION = "v1.1.3";
window.TOKI_VIEWER_VERSION = VIEWER_VERSION;

let allSeries = [];
let currentTab = 'all';

// ============================================================
// 1. Initialization & Handshake
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    // [추가] 아이폰 사이드 클릭 시 검정 바 UI가 뜨는 현상 원천 차단
    document.addEventListener('click', function(e) {
        const xPercent = (e.clientX / window.innerWidth) * 100;
        if (xPercent < 35 || xPercent > 65) {
            e.stopPropagation(); // 좌우 끝을 누르면 메뉴 호출 이벤트를 가로챔
        }
    }, true); 

    window.addEventListener("message", handleMessage, false);
    
    const el = document.getElementById('viewerVersionDisplay');
    if(el) el.innerText = `Viewer Version: ${VIEWER_VERSION}`;
    
    // 자동 설정 및 데이터 로드
    if (typeof API !== 'undefined') {
        API.setConfig(`https://script.google.com/macros/s/${MY_GAS_ID}/exec`, MY_FOLDER_ID);
        refreshDB(null, true);
        loadDomains();
        loadHistory(); // [추가] 최근 읽은 목록 불러오기
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

// ============================================================
// 2. Data Fetching
// ============================================================

async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    const btn = document.getElementById('refreshBtn');

    if (!silent) {
        if(loader) loader.style.display = 'flex';
        if(btn) btn.classList.add('spin-anim');
    }

    try {
        let tempSeries = [];
        let continuationToken = null;

        while (true) {
            const payload = { folderId: forceId || MY_FOLDER_ID };
            if (bypassCache) payload.bypassCache = true;
            if (continuationToken) payload.continuationToken = continuationToken;

            const response = await API.request('view_get_library', payload);
            
            if (Array.isArray(response)) {
                tempSeries = tempSeries.concat(response);
                break;
            } else if (response && response.list) {
                tempSeries = tempSeries.concat(response.list);
                if (response.status === 'continue' && response.continuationToken) {
                    continuationToken = response.continuationToken;
                    continue;
                }
                break;
            } else break;
        }

        allSeries = tempSeries;
        renderGrid(allSeries);
        showToast("📚 라이브러리 업데이트 완료");
    } catch (e) {
        console.error("Library Fetch Error:", e);
        showToast(`❌ 로드 실패: ${e.message}`);
    } finally {
        if(loader) loader.style.display = 'none';
        if(btn) btn.classList.remove('spin-anim');
    }
}

// ============================================================
// 3. UI Rendering
// ============================================================

function renderGrid(seriesList) {
    const grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML = '';

    if (!seriesList || seriesList.length === 0) {
        grid.innerHTML = '<div class="no-data">저장된 작품이 없습니다.</div>';
        return;
    }

    seriesList.forEach((series, index) => {
        const thumb = series.thumbnailId ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const dynamicUrl = getDynamicLink(series);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <button onclick="saveReadHistory('${series.id}', '${series.name.replace(/'/g, "\\'")}'); openEpisodeList('${series.id}', '${series.name.replace(/'/g, "\\'")}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                    <a href="${dynamicUrl}" target="_blank" class="btn btn-site">🌐 사이트</a>
                </div>
            </div>
            <div class="info">
                <div class="title" title="${series.name}">${series.name}</div>
                <div class="meta">
                    <span class="badge ${series.metadata?.status === 'COMPLETED' ? 'completed' : 'ongoing'}">${series.metadata?.status || 'Unknown'}</span>
                    <span class="count">${series.booksCount || 0}권</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// [추가] 히스토리 관련 기능
window.saveReadHistory = async function(seriesId, seriesName) {
    try {
        await API.request('view_save_bookmark', {
            folderId: MY_FOLDER_ID,
            seriesId: seriesId,
            name: seriesName,
            time: new Date().getTime()
        });
        loadHistory();
    } catch (e) { console.error("History Save Error"); }
};

async function loadHistory() {
    const container = document.getElementById('recentList');
    if (!container) return;
    try {
        const res = await API.request('view_get_bookmarks', { folderId: MY_FOLDER_ID });
        if (!res || Object.keys(res).length === 0) {
            container.innerHTML = '<div style="color:#666; font-size:12px;">최근 기록 없음</div>';
            return;
        }
        container.innerHTML = '';
        const items = Object.values(res).sort((a, b) => b.time - a.time).slice(0, 5);
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerText = `📖 ${item.name}`;
            div.onclick = () => openEpisodeList(item.seriesId, item.name, 0);
            container.appendChild(div);
        });
    } catch (e) { container.innerHTML = '로드 실패'; }
}

// 기존 유틸리티 함수들 (전부 유지)
function switchTab(tabName) {
    currentTab = tabName;
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.innerText === getTabLabel(tabName)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    filterData();
}

function getTabLabel(key) {
    if (key === 'all') return '전체';
    if (key === 'Webtoon') return '웹툰';
    if (key === 'Manga') return '만화';
    if (key === 'Novel') return '소설';
    return '';
}

function filterData() {
    const query = document.getElementById('search').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const series = allSeries[index];
        const text = (series.name + (series.metadata?.authors?.join(' ') || '')).toLowerCase();
        const matchText = text.includes(query);
        const cat = series.category || series.metadata?.category || 'Unknown';
        const matchTab = (currentTab === 'all') || (cat === currentTab);
        card.style.display = (matchText && matchTab) ? 'flex' : 'none';
    });
}

function showToast(msg, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, duration);
}

function loadDomains() {
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    ['newtoki', 'manatoki', 'booktoki'].forEach(id => {
        const el = document.getElementById(`url_${id}`);
        if(el) el.value = saved[id];
    });
}

function getDynamicLink(series) {
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    let cat = series.category || series.metadata?.category || '';
    if (cat === "Novel") return `https://booktoki${saved.booktoki}.com/novel/${series.sourceId}`;
    if (cat === "Manga") return `https://manatoki${saved.manatoki}.net/comic/${series.sourceId}`;
    return `https://newtoki${saved.newtoki}.com/webtoon/${series.sourceId}`;
}

window.changeFontSize = function(delta) {
    const content = document.getElementById('innerContent');
    if (!content) return;
    let current = parseFloat(window.getComputedStyle(content).fontSize);
    content.style.fontSize = (current + delta * 10) + 'px';
};

// 전역 노출
window.refreshDB = refreshDB;
window.switchTab = switchTab;
window.filterData = filterData;
