import { vState, currentBookList, currentBookIndex, updateCurrentBookIndex, nextBookPreload, setNextBookPreload } from './state.js';
import { fetchAndUnzip } from './fetcher.js';
import { renderLegacyMode, renderCurrentSpread, renderScrollMode, loadAllImageDimensions, recalcSpreads } from './renderer.js';
import { updateNavHandlers, updateButtonStates, closeViewer, loadViewerSettings } from './controls.js';
import { renderEpisodeList } from './episode.js';
import { showToast, getProgress, formatSize } from './utils.js';

// 목록 창 열기
export async function openEpisodeList(seriesId, title, seriesIndex) {
    document.getElementById('episodeModal').style.display = 'flex';
    document.querySelector('#episodeModal .modal-title').innerText = `📄 ${title}`;
    const listEl = document.getElementById('episodeList');
    listEl.innerHTML = '<div style="padding:20px; color:#888;">로딩 중...</div>';

    try {
        const books = await API.request('view_get_books', { seriesId: seriesId });
        document.querySelector('#episodeModal .modal-title').innerText = `📄 ${title} (${books ? books.length : 0}개)`;
        renderEpisodeList(books, seriesId);
    } catch (e) {
        listEl.innerHTML = `<div style="padding:20px; color:red;">오류: ${e.message}</div>`;
    }
}

// 목록 창 닫기
export function closeEpisodeModal() {
    document.getElementById('episodeModal').style.display = 'none';
}

// 뷰어 실행
export async function loadViewer(index, isContinuous = false) {
    const book = currentBookList[index];
    if (!book) return;

    closeEpisodeModal();
    updateCurrentBookIndex(index);
    loadViewerSettings();

    const viewer = document.getElementById('viewerOverlay');
    const content = document.getElementById('viewerContent');
    const container = document.getElementById('viewerImageContainer');
    vState.spreads = []; 
    window.isViewerLoading = true; 
    
    viewer.style.display = 'flex';
    document.body.classList.add('no-scroll'); 

    container.innerHTML = '<div style="color:white; font-size:14px;">로딩 중... (0%)</div>';
    updateNavHandlers();
    
    if(vState.scrollMode) {
        content.classList.add('scroll-mode');
        container.classList.remove('viewer-image-container'); 
        container.style.display = 'none'; 
        
        let scrollContainer = document.getElementById('viewerScrollContainer');
        if(!scrollContainer) {
            scrollContainer = document.createElement('div');
            scrollContainer.id = 'viewerScrollContainer';
            scrollContainer.className = 'viewer-scroll-container';
            content.appendChild(scrollContainer);
        }
        scrollContainer.innerHTML = '<div style="color:white; font-size:14px; padding:20px;">로딩 중... (0%)</div>';
        scrollContainer.style.display = 'block'; 
    } else {
        content.classList.remove('scroll-mode');
        container.classList.add('viewer-image-container');
        container.style.display = 'flex';
        const sc = document.getElementById('viewerScrollContainer');
        if(sc) sc.style.display = 'none';
    }

    try {
        let result = null;
        let blobUrls = [];
        
        if (nextBookPreload && nextBookPreload.index === index && Array.isArray(nextBookPreload.images)) {
            blobUrls = nextBookPreload.images;
            setNextBookPreload(null);
        } else {
            if (nextBookPreload && nextBookPreload.index === index) setNextBookPreload(null);

            result = await fetchAndUnzip(book.id, book.size || 0, (progress) => {
                const el = container.querySelector('div');
                if (el) el.innerText = progress;
            });
            blobUrls = result; 
        }

        if (!result || (result.type === 'images' && result.images.length === 0)) throw new Error("콘텐츠를 찾을 수 없습니다.");

        if (result.type === 'epub_legacy') {
            vState.epubMode = true;
            updateButtonStates(); 
            renderLegacyMode(result.content);
            return;
        } else {
            vState.epubMode = false;
            updateButtonStates(); 
            blobUrls = result.images;
        }

        vState.images = blobUrls.map(url => ({ src: url, width: 0, height: 0, loaded: false }));
        await loadAllImageDimensions(vState.images);
        recalcSpreads(false); 

        const lastPage = getProgress(book.seriesId, book.id);
        if (vState.scrollMode) {
            renderScrollMode();
             if (!isContinuous && lastPage > 0) {
                 const { scrollToPage } = await import('./renderer.js');
                 scrollToPage(lastPage);
             }
        } else {
             if (!isContinuous && lastPage > 0 && lastPage < vState.images.length) {
                 const spreadIdx = vState.spreads.findIndex(spread => spread.includes(lastPage));
                 vState.currentSpreadIndex = spreadIdx >= 0 ? spreadIdx : 0;
                 showToast(`📑 이어보기: ${lastPage + 1}페이지`);
             } else {
                 vState.currentSpreadIndex = 0;
             }
             renderCurrentSpread();
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="color:red; text-align:center;">오류 발생: ${e.message}<br><button onclick="closeViewer()" style="margin-top:20px; padding:10px;">닫기</button></div>`;
    } finally {
        setTimeout(() => { window.isViewerLoading = false; }, 500);
    }
}

// 다음 화 트리거 체크
export function checkNextEpisodeTrigger() {
    if (!window.isLoadingNext) {
        const nextIndex = currentBookIndex + 1;
        if (currentBookList[nextIndex]) {
            window.isLoadingNext = true;
            showToast("⏩ 다음 화를 불러옵니다...", 2000);
            setTimeout(() => {
                loadViewer(nextIndex, true)
                    .then(() => { window.isLoadingNext = false; })
                    .catch(() => window.isLoadingNext = false);
            }, 500); 
        } else {
            showToast("🏁 마지막 회차입니다.");
        }
    }
}

// 다음 화 미리 불러오기
export function preloadNextEpisode() {
    if (!vState.preload) return; 
    const nextIndex = currentBookIndex + 1;
    if (nextIndex >= currentBookList.length || window.isPreloading) return;

    window.isPreloading = true;
    fetchAndUnzip(currentBookList[nextIndex].id, currentBookList[nextIndex].size || 0, null)
        .then(blobUrls => {
            setNextBookPreload({ index: nextIndex, images: blobUrls });
            window.isPreloading = false;
        })
        .catch(() => window.isPreloading = false);
}

// 뷰어 안에서 목록 열기
export function openEpisodeListFromViewer() {
    const book = currentBookList[currentBookIndex];
    if(book) {
        const title = document.getElementById('viewerTitle') ? document.getElementById('viewerTitle').innerText : "목록";
        openEpisodeList(book.seriesId, title);
    }
}
