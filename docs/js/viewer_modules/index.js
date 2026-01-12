/**
 * 🚀 Viewer Modules Aggregator (Final Bridge)
 */
import { openEpisodeList, loadViewer, closeEpisodeModal } from './actions.js';
import { navigateViewer } from './navigation.js';
import { toggleViewMode, toggleScrollMode, toggleCoverMode, toggleRtlMode, togglePreloadMode, closeViewer, handleViewerClick, onSliderInput, onSliderChange, initKeyControls } from './controls.js';

// ---------------------------------------------------------
// 🌐 [1] 설정창 및 전역 함수 강제 등록
// ---------------------------------------------------------
window.toggleSettings = function() {
    const panel = document.getElementById('domainPanel');
    if (panel) {
        panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
    }
};

window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeViewer = closeViewer;
window.handleViewerClick = handleViewerClick;
window.navigateViewer = navigateViewer;
window.onSliderInput = onSliderInput;
window.onSliderChange = onSliderChange;
window.toggleScrollMode = toggleScrollMode;
window.closeEpisodeModal = closeEpisodeModal;

// ---------------------------------------------------------
// ⚙️ [2] 초기화 실행 (에러 방지)
// ---------------------------------------------------------
try {
    if (typeof initKeyControls === 'function') initKeyControls();
    console.log("🚀 Bridge Online");
} catch(e) {
    console.warn("Init notice:", e);
}
