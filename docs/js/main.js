/**
 * 🚀 Main Dashboard Logic (Final Fixed Version)
 */

// [1] 전역 상수 설정
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
const MY_FOLDER_ID = "1pqN828teolRePME7XmXBZsjCwRBmWrts";
const MY_GAS_URL = `https://script.google.com/macros/s/${MY_GAS_ID}/exec`;

var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

// [2] 탭 전환 함수 (ReferenceError 해결)
window.switchTab = function(tabId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // 선택된 섹션 보이기
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
};

// [3] 설정 저장
window.saveSettings = function() {
    const gasIdInput = document.getElementById('gasId');
    const folderIdInput = document.getElementById('folderId');
    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    
    config.gasUrl = `https://script.google.com/macros/s/${(gasIdInput && gasIdInput.value.trim()) || MY_GAS_ID}/exec`;
    config.folderId = (folderIdInput && folderIdInput.value.trim()) || MY_FOLDER_ID;
    
    localStorage.setItem('tokisync_config', JSON.stringify(config));
    alert("설정이 저장되었습니다.");
    location.reload();
};

// [4] 에피소드 목록 열기
window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("모듈 로딩 중입니다. 잠시 후 다시 시도하세요.");
    }
};

// [5] 그리드 렌더링
window.renderGrid = function(seriesList) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!seriesList || seriesList.length === 0) {
        grid.innerHTML = '<div style="color:white; padding:20px;">데이터가 없습니다.</div>';
        return;
    }

    seriesList.forEach((series, index) => {
        const thumb = series.thumbnailId ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400` : NO_IMAGE_SVG;
        const safeTitle = (series.name || "").replace(/'/g, "\\'");
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

// [6] 데이터 로드 및 초기화
window.refreshDB = async function(refresh = false) {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';

    // 🔴 API URL 강제 설정 (API URL 미설정 에러 해결)
    if (window.API) {
        window.API.gasUrl = MY_GAS_URL; // API 객체에 직접 주입
    }
    
    let config = { gasUrl: MY_GAS_URL, folderId: MY_FOLDER_ID };
    localStorage.setItem('tokisync_config', JSON.stringify(config));

    try {
        if (window.API && typeof window.API.request === 'function') {
            const response = await window.API.request('view_get_library', { folderId: MY_FOLDER_ID, refresh: refresh });
            window.renderGrid(Array.isArray(response) ? response : []);
            if (window.renderRecentList) window.renderRecentList().catch(() => {});
        }
    } catch (e) {
        console.error("Data load fail:", e);
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

window.getDynamicLink = (s) => "#";

// [7] 초기 구동
window.addEventListener('DOMContentLoaded', () => {
    // 탭 초기화
    window.switchTab('library');
    
    // API 로드 대기 후 실행
    let retryCount = 0;
    const authCheck = setInterval(() => {
        if (window.API) {
            clearInterval(authCheck);
            window.refreshDB();
        } else if (retryCount > 50) {
            clearInterval(authCheck);
            const loader = document.getElementById('pageLoader');
            if (loader) loader.style.display = 'none';
        }
        retryCount++;
    }, 100);
});
