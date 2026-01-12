/**
 * 🚀 Main Dashboard Logic
 */
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";

window.handleOpenEpisodes = function(id, name, index) {
    if (typeof window.openEpisodeList === 'function') {
        window.openEpisodeList(id, name, index);
    } else {
        alert("잠시만 기다려주세요 (모듈 로딩 중)");
    }
};

window.refreshDB = async function(f, s, b) {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'flex';

    // 🔴 접속 주소 강제 업데이트
    let config = JSON.parse(localStorage.getItem('tokisync_config') || '{}');
    config.gasUrl = `https://script.google.com/macros/s/${MY_GAS_ID}/exec`;
    localStorage.setItem('tokisync_config', JSON.stringify(config));

    try {
        const response = await API.request('view_get_library', { folderId: API.folderId, refresh: b });
        window.renderGrid(Array.isArray(response) ? response : []);
        // 북마크 로딩은 실패해도 무시 (무한 로딩 방지)
        if (window.renderRecentList) window.renderRecentList().catch(() => {});
    } catch (e) {
        console.error("데이터 로드 실패", e);
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

// ... (renderGrid 등 나머지 코드는 이전 답변과 동일)
