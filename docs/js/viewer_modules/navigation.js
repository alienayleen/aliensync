import { vState, currentBookList, currentBookIndex } from './state.js';
import { loadViewer, checkNextEpisodeTrigger } from './actions.js';
import { renderCurrentSpread } from './renderer.js';
import { showToast } from './utils.js';

// 페이지 이동 통합 핸들러
export function navigateViewer(dir) {
    if (window.isViewerLoading) return;
    
    if (vState.scrollMode) {
        navigateScrollMode(dir);
        return;
    }
    
    if (vState.epubMode) {
        navigateTextPage(dir);
        return;
    }

    const nextIdx = vState.currentSpreadIndex + dir;
    if (nextIdx >= vState.spreads.length) {
        if (currentBookIndex < currentBookList.length - 1) {
             if (confirm("다음 화로 이동하시겠습니까?")) loadViewer(currentBookIndex + 1, true);
        } else {
             showToast("마지막 화입니다.");
        }
        return;
    }
    if (nextIdx < 0) {
        showToast("첫 페이지입니다.");
        return;
    }
    vState.currentSpreadIndex = nextIdx;
    renderCurrentSpread();
}

// 스크롤 모드 이동 로직
export function navigateScrollMode(dir) {
    if (window.isViewerLoading) return;

    let container = document.getElementById('viewerScrollContainer');
    if (!container) return;

    const clientHeight = container.clientHeight || window.innerHeight;
    const scrollAmount = clientHeight * 0.9;
    const currentScroll = container.scrollTop;
    const maxScroll = container.scrollHeight - clientHeight;

    if (dir === 1) { // 다음
        if (Math.abs(currentScroll - maxScroll) < 10) {
             if (!window.scrollBottomTriggered) {
                 window.scrollBottomTriggered = true;
                 showToast("마지막입니다. 한번 더 내리면 다음 화로 이동합니다.");
                 return;
             }
             checkNextEpisodeTrigger();
             return;
        }
        window.scrollBottomTriggered = false;
        container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    } else { // 이전
        window.scrollBottomTriggered = false;
        if (currentScroll <= 10) {
            showToast("첫 부분입니다.");
            return;
        }
        container.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }
}

// 텍스트(소설) 페이지 이동
export function navigateTextPage(dir) {
    import('./actions.js').then(module => {
        module.checkNextEpisodeTrigger();
    });
}
