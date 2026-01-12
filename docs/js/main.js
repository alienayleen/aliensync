/**
 * 🚀 Main Dashboard Logic (Final Hardcoded Version)
 */

// [1] 상수 설정
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
const MY_FOLDER_ID = "1pqN828teolRePME7XmXBZsjCwRBmWrts";
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

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

// [5] 데이터 로드 및 초기화
window.refreshDB = async function(f, s, b) {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';

    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    config.gasUrl = `https://script.google.com/macros/s/${MY_GAS_ID}/exec`;
    config.folderId = MY_FOLDER_ID;
    localStorage.setItem('tokisync_config', JSON.stringify(config));

    try {
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

// [6] 실행부: 모든 괄호와 세미콜론 확인 완료
window.addEventListener('DOMContentLoaded', () => { 
    if (window.API) {
        window.refreshDB();
    } 
});
