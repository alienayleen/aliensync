/**
 * 🚀 TokiSync - Original Main Logic (Clean Version)
 */

// [1] 딱 이 두 줄만 본인의 정보로 수정하세요.
const MY_GAS_ID = "AKfycbx7xMPoRnPeDZGvcJbqP0FJNX1tOvk5YYdLaLWbSqGftvSnrhkZwtDSlbw2_5TNKXpq-A";
const MY_FOLDER_ID = "1pqN828teolRePME7XmXBZsjCwRBmWrts";

// [2] 설정값 생성
const CONFIG = {
    gasUrl: `https://script.google.com/macros/s/${MY_GAS_ID}/exec`,
    folderId: MY_FOLDER_ID
};

// [3] 초기화 및 데이터 로드 (원본 로직 그대로 복구)
window.addEventListener('DOMContentLoaded', () => {
    // 탭 초기화
    if (typeof window.switchTab === 'function') {
        window.switchTab('library');
    }

    // API 연동 및 데이터 호출
    const checkAPI = setInterval(() => {
        if (window.API) {
            clearInterval(checkAPI);
            
            // API에 설정값 주입
            window.API.gasUrl = CONFIG.gasUrl;
            localStorage.setItem('tokisync_config', JSON.stringify(CONFIG));
            
            // 로딩바 표시 및 데이터 로드
            const loader = document.getElementById('pageLoader');
            if (loader) loader.style.display = 'flex';
            
            window.API.request('view_get_library', { folderId: CONFIG.folderId })
                .then(res => {
                    if (window.renderGrid) window.renderGrid(res);
                })
                .catch(err => console.error("Load Error:", err))
                .finally(() => {
                    if (loader) loader.style.display = 'none';
                });
        }
    }, 100);
});

/**
 * 💡 주의: switchTab, renderGrid 등의 함수는 원본 구조상 
 * index.html이나 다른 js 파일(ui.js 등)에 정의되어 있어야 합니다.
 * 만약 그 파일들도 수정하셨다면 원본 저장소에서 다시 복사해오셔야 합니다.
 */
