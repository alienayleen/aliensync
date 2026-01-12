import { openEpisodeList, loadViewer, closeEpisodeModal, openEpisodeListFromViewer } from './actions.js';
import { navigateViewer } from './navigation.js';
import { toggleViewMode, toggleScrollMode, toggleCoverMode, toggleRtlMode, togglePreloadMode, changeFontSize, closeViewer, handleViewerClick, onSliderInput, onSliderChange, initKeyControls } from './controls.js';

// ⚙️ 설정창 에러(aliensync/:22) 해결: 무조건 전역(window)에 박습니다.
window.toggleSettings = function() {
    const panel = document.getElementById('domainPanel');
    if (panel) {
        panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
    } else {
        alert("설정 패널(domainPanel)을 찾을 수 없습니다.");
    }
};

// 📄 목록열기 및 필수 기능 전역 노출
window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeViewer = closeViewer;
window.handleViewerClick = handleViewerClick;
window.navigateViewer = navigateViewer;
window.toggleScrollMode = toggleScrollMode;

initKeyControls();
console.log("🚀 [System] 전역 브릿지 연결 완료");
