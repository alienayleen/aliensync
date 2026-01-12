/**
 * 🚀 Viewer Modules Aggregator (Final Disaster Recovery)
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
// 🌐 [중요] HTML 버튼과 연결되는 전역 함수 강제 등록
// ---------------------------------------------------------

// 1. 설정 버튼 에러 해결 (toggleSettings가 toggleControls와 같은 역할이라면)
window.toggleSettings = function() {
    const panel = document.getElementById('domainPanel');
    if (panel) {
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
};

// 2. 목록열기 및 필수 뷰어 함수 연결
window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeEpisodeModal = closeEpisodeModal;
window.openEpisodeListFromViewer = openEpisodeListFromViewer;
window.navigateViewer = navigateViewer;
window.closeViewer = closeViewer;
window.handleViewerClick = handleViewerClick;
window.onSliderInput = onSliderInput;
window.onSliderChange = onSliderChange;

// 3. 뷰어 설정 관련
window.toggleViewMode = toggleViewMode;
window.toggleScrollMode = toggleScrollMode;
window.toggleCoverMode = toggleCoverMode;
window.toggleRtlMode = toggleRtlMode;
window.togglePreloadMode = togglePreloadMode;

// ---------------------------------------------------------
// ⚙️ 초기화 실행
// ---------------------------------------------------------
initKeyControls(); 
console.log("🚀 Viewer Modules Globally Exposed & Initialized");
