/* viewer_modules/index.js 전체 교체 */
import { openEpisodeList, loadViewer, closeEpisodeModal, openEpisodeListFromViewer } from './actions.js';
import { navigateViewer } from './navigation.js';
import { toggleViewMode, toggleScrollMode, toggleCoverMode, toggleRtlMode, togglePreloadMode, changeFontSize, closeViewer, handleViewerClick, onSliderInput, onSliderChange, initKeyControls } from './controls.js';

// 1. 설정 버튼(⚙️) 강제 복구
window.toggleSettings = function() {
    const panel = document.getElementById('domainPanel');
    if (panel) panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
};

// 2. 목록 열기(서재 열기) 핵심 함수 노출
window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeViewer = closeViewer;
window.handleViewerClick = handleViewerClick;
window.navigateViewer = navigateViewer;
window.onSliderInput = onSliderInput;
window.onSliderChange = onSliderChange;

initKeyControls();
console.log("🚀 Viewer Bridge: OK");
