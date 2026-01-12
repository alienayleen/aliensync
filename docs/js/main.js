/**
 * 🚀 Main Dashboard Logic (Final Emergency Fix)
 */

// [0] 최상단 설정 주입 (API 객체가 생성되기 전이나 후에 모두 대응)
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
const MY_FOLDER_ID = "1pqN828teolRePME7XmXBZsjCwRBmWrts";
const MY_GAS_URL = `https://script.google.com/macros/s/${MY_GAS_ID}/exec`;

// 즉시 로컬스토리지 세팅
(function preInit() {
    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    config.gasUrl = MY_GAS_URL;
    config.folderId = MY_FOLDER_ID;
    localStorage.setItem('tokisync_config', JSON.stringify(config));
})();

var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

// [1] 탭 전환 함수 복구 (ReferenceError 해결)
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
};

// [2] 설정 저장 함수
window.saveSettings = function() {
    const gasIdInput = document.getElementById('gasId');
    const folderIdInput = document.getElementById('folderId');
    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    
    config.gasUrl = `https://script.google.com/macros/s/${(gasIdInput && gasIdInput.value.trim()) || MY_GAS_ID}/exec`;
    config.folderId = (folderIdInput && folderIdInput.value.trim()) || MY_FOLDER_ID;
    
    localStorage.setItem('tokisync_config', JSON.stringify(config));
    alert("설정이 저장되었습니다!");
    location.reload();
};

// [3] 목록 열기 핸들러
window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("모듈 로딩 중입니다. 1초 뒤에 다시 시도하세요.");
    }
};

// [4] 그리드 렌더링
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
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn">📄 목록열기</button>
                </div>
            </div>
            <div class="info"><div class="title">${series.name}</div></div>`;
        grid.appendChild(card);
    });
};

// [5] 데이터 로드 (핵심 수정 부분)
window.refreshDB = async function(f, s, b) {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';

    // 🔴 API 객체에 URL 직접 강제 주입 (에러 방어)
    if (window.API) {
        window.API.gasUrl = MY_GAS_URL; 
        if (window.API.config) window.API.config.gasUrl = MY_GAS_URL;
    }

    try {
        // API 요청 시 강제로 hardcoded된 folderId 사용
        const response = await API.request('view_get_library', { folderId: MY_FOLDER_ID, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        if (window.renderRecentList) window.renderRecentList().catch(() => {});
    } catch (e) {
        console.error("Data load fail:", e);
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

window.getDynamicLink = (s) => "#"; 

// [6] 초기 구동 로직
window.addEventListener('DOMContentLoaded', () => {
    window.switchTab('library'); // 기본 탭 활성화
    
    let attempts = 0;
    const authCheck = setInterval(() => {
        attempts++;
        if (window.API) {
            clearInterval(authCheck);
            window.refreshDB();
        } else if (attempts > 50) {
            clearInterval(authCheck);
            const loader = document.getElementById('pageLoader');
            if (loader) loader.style.display = 'none';
        }
    }, 100);
});
