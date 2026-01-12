/**
 * 🚀 Viewer Modules Aggregator (Final Bridge)
 * 모든 함수를 전역 window 객체에 등록하여 버튼(onclick)과 main.js에서 호출 가능하게 합니다.
 */

import { vState } from './state.js';
import { 
    openEpisodeList, 
    loadViewer, 
    closeEpisodeModal, 
    openEpisodeListFromViewer 
} from './actions.js';

import { 
    navigateViewer, 
    navigateScrollMode 
} from './navigation.js';

import { 
    toggleViewMode, 
    toggleScrollMode, 
    toggleCoverMode, 
    toggleRtlMode, 
    togglePreloadMode, 
    changeFontSize, 
    closeViewer, 
    toggleControls, 
    handleViewerClick,
    onSliderInput,
    onSliderChange,
    initKeyControls
} from './controls.js';

// ---------------------------------------------------------
// 🌐 [1] 설정창(⚙️) 미정의 에러 해결 및 전역 함수 강제 등록
// ---------------------------------------------------------

// aliensync/:22 toggleSettings 에러를 물리적으로 제거합니다.
window.toggleSettings = function() {
    const panel = document.getElementById('domainPanel');
    if (panel) {
        const isHidden = panel.style.display === 'none' || panel.style.display === '';
        panel.style.display = isHidden ? 'block' : 'none';
    }
};

// 메인 화면 버튼들이 사용하는 함수들
window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeEpisodeModal = closeEpisodeModal;
window.openEpisodeListFromViewer = openEpisodeListFromViewer;
window.navigateViewer = navigateViewer;
window.closeViewer = closeViewer;
window.handleViewerClick = handleViewerClick;
window.onSliderInput = onSliderInput;
window.onSliderChange = onSliderChange;

// 뷰어 설정 버튼들이 사용하는 함수들
window.toggleViewMode = toggleViewMode;
window.toggleScrollMode = toggleScrollMode;
window.toggleCoverMode = toggleCoverMode;
window.toggleRtlMode = toggleRtlMode;
window.togglePreloadMode = togglePreloadMode;
window.changeFontSize = changeFontSize;

// ---------------------------------------------------------
// ⚙️ [2] 초기화 실행 (에러 방지 로직 포함)
// ---------------------------------------------------------
try {
    if (typeof initKeyControls === 'function') {
        initKeyControls();
    }
    console.log("🚀 Viewer Modules Globally Exposed & Initialized");
} catch(e) {
    console.warn("Init notice: Key controls initialization skipped or failed.", e);
}
