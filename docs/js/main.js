/**
 * 🚀 Main Dashboard Logic (Final Fixed with Save Function)
 */

// 사용자님이 알려주신 최신 GAS ID 강제 적용 (백업용)
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
var NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

// ---------------------------------------------------------
// 💾 [1] 설정 저장 함수 (이게 있어야 저장이 됩니다!)
// ---------------------------------------------------------
window.saveSettings = function() {
    const gasIdInput = document.getElementById('gasId');
    const folderIdInput = document.getElementById('folderId');
    
    // 도메인 입력값들 (있는 경우만)
    const ntInput = document.getElementById('newtoki');
    const mtInput = document.getElementById('manatoki');
    const btInput = document.getElementById('booktoki');

    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    
    // 1. GAS ID 저장 (ID만 입력해도 전체 URL로 변환)
    if (gasIdInput && gasIdInput.value.trim()) {
        config.gasUrl = `https://script.google.com/macros/s/${gasIdInput.value.trim()}/exec`;
    } else {
        // 입력값이 없으면 제가 박아드린 기본 ID 사용
        config.gasUrl = `https://script.google.com/macros/s/${MY_GAS_ID}/exec`;
    }

    // 2. 폴더 ID 저장
    if (folderIdInput && folderIdInput.value.trim()) {
        config.folderId = folderIdIdInput.value.trim();
    }

    localStorage.setItem('tokisync_config', JSON.stringify(config));

    // 3. 도메인 설정 저장
    let domains = {
        newtoki: (ntInput && ntInput.value) ? ntInput.value : '469',
        manatoki: (mtInput && mtInput.value) ? mtInput.value : '469',
        booktoki: (btInput && btInput.value) ? btInput.value : '469'
    };
    localStorage.setItem('toki_domains', JSON.stringify(domains));

    alert("설정이 저장되었습니다! 목록을 불러오기 위해 페이지를 새로고침합니다.");
    location.reload();
};

// ---------------------------------------------------------
// 📄 [2] 기존 대시보드 기능들 (목록열기, 그리드 등)
// ---------------------------------------------------------

window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("모듈 로딩 중입니다. 잠시 후 다시 눌러주세요.");
    }
};

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
                    <button onclick="window.handleOpenEpisodes('${series.id}', '${safeTitle}', ${index})" class="btn" style="background:#444; color:white;">📄 목록열기</button>
                </div>
            </div>
            <div class="info"><div class="title">${series.name}</div></div>`;
        grid.appendChild(card);
    });
};

window.refreshDB = async function(f, s, b) {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';
    try {
        const response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
    } catch (e
