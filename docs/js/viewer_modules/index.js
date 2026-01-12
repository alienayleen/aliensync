/**
 * 🚀 Viewer Modules Aggregator (Final Fixed Version)
 */

// 1. 각 모듈에서 함수 가져오기
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

/**
 * 2. 전역(window) 객체에 강제 할당 (Bridge)
 * 이 작업이 있어야 main.js와 HTML 버튼에서 함수를 찾을 수 있습니다.
 */
window.openEpisodeList = openEpisodeList; 
window.loadViewer = loadViewer;
window.closeEpisodeModal = closeEpisodeModal;
window.openEpisodeListFromViewer = openEpisodeListFromViewer;

window.navigateViewer = navigateViewer;
window.navigateScrollMode = navigateScrollMode;

window.toggleViewMode = toggleViewMode;
window.toggleScrollMode = toggleScrollMode;
window.toggleCoverMode = toggleCoverMode;
window.toggleRtlMode = toggleRtlMode;
window.togglePreloadMode = togglePreloadMode;
window.changeFontSize = changeFontSize;
window.closeViewer = closeViewer;
window.toggleControls = toggleControls;
window.handleViewerClick = handleViewerClick;
window.onSliderInput = onSliderInput;
window.onSliderChange = onSliderChange;

// 3. 뷰어 초기화 실행
initKeyControls(); 

console.log("🚀 Viewer Modules Globally Exposed & Initialized");
