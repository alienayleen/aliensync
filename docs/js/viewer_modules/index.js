/**
 * Viewer Modules Aggregator
 * Exposes all necessary functions to global window object
 */

import { vState, currentBookList, currentBookIndex } from './state.js';
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

// Expose to Window
window.openEpisodeList = openEpisodeList;
window.loadViewer = loadViewer;
window.closeEpisodeModal = closeEpisodeModal;
window.openEpisodeListFromViewer = openEpisodeListFromViewer;

window.navigateViewer = navigateViewer;

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

window.saveCurrentBookmark = function() {
    const book = currentBookList[currentBookIndex];
    if (!book) {
        if (window.showToast) window.showToast("북마크할 작품이 없습니다.");
        return;
    }

    if (typeof window.saveBookmarkRecord === 'function') {
        window.saveBookmarkRecord(
            book.seriesId,
            book.seriesName || book.seriesId,
            book.id,
            book.name,
            book.category
        );
    } else if (window.showToast) {
        window.showToast("북마크 기능이 준비되지 않았습니다.");
    }
};

// Initialize Key Controls
initKeyControls(); // Start listening
console.log("🚀 Viewer Modules Loaded & Initialized");
