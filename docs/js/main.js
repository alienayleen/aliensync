/**
 * 🚀 TokiSync Frontend - Main Controller
 * - Handles Initialization
 * - Config Handshake (Zero-Config)
 * - Grid Rendering
 */

const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

// Domains for Quick Link (Numbers Only)
const DEFAULT_DOMAINS = {
    newtoki: '469',
    manatoki: '469',
    booktoki: '469'
};

const VIEWER_VERSION = "v1.1.3"; // Ver Check & Whitelist
// [New] Expose Version to Global Scope for Debugging
window.TOKI_VIEWER_VERSION = VIEWER_VERSION;

let allSeries = [];

// ============================================================
// 1. Initialization & Handshake
// ============================================================


/**
 * UserScript(Tampermonkey)로부터의 설정 주입 메시지를 처리합니다.
 * Zero-Config: 별도 설정 없이 바로 서버 URL과 폴더 ID를 수신하여 설정합니다.
 * 
 * @param {MessageEvent} event - window message event
 */
function handleMessage(event) {
    if (event.data.type === 'TOKI_CONFIG') {
        const { url, folderId, deployId } = event.data;
        if (url && folderId) {
            console.log("⚡️ Auto-Config Injected:", { url, folderId });
            API.setConfig(url, folderId);
            
            // UI Update
            document.getElementById('configModal').style.display = 'none';
            showToast("⚡️ 자동 설정 완료! (Zero-Config)");
            
            refreshDB();
        }
    }
}

// ============================================================
// 2. Data Fetching
// ============================================================
/**
 * 라이브러리 데이터를 서버에서 새로고침합니다.
 * 
 * @param {string} [forceId=null] - 강제로 특정 폴더 ID를 사용할 경우 지정
 * @param {boolean} [silent=false] - 로딩 인디케이터 표시 여부 (true면 숨김)
 * @param {boolean} [bypassCache=false] - 서버 캐시 무시 여부 (강제 새로고침)
 */
async function refreshDB(forceId = null, silent = false, bypassCache = false) {
    const loader = document.getElementById('pageLoader');
    const btn = document.getElementById('refreshBtn');

    if (!silent) {
        if(loader) {
            loader.style.display = 'flex';
            // Reset loader text
            const txt = loader.querySelector('div:last-child');
            if(txt) txt.innerText = "데이터 불러오는 중...";
        }
        if(btn) btn.classList.add('spin-anim');
    }

    try {
        let allSeries = [];
        let continuationToken = null;
        let step = 1;

        // Loop for Continuation Token
        while (true) {
            const payload = { 
                folderId: forceId || API.folderId 
            };
            if (bypassCache) payload.bypassCache = true;
            if (continuationToken) payload.continuationToken = continuationToken;

            const response = await API.request('view_get_library', payload);
            
            // Handle Response
            // Response might be direct array (Legacy/Small) or object
            
            if (Array.isArray(response)) {
                // Legacy or Simple Response
                allSeries = allSeries.concat(response);
                break; // Done
            } 
            else if (response) {
                // Object Response (Standard v3.3+)
                // 1. Accumulate List if present
                if (response.list && Array.isArray(response.list)) {
                    allSeries = allSeries.concat(response.list);
                }

                // 2. Check Status
                if (response.status === 'continue') {
                    if (response.continuationToken) {
                        continuationToken = response.continuationToken;
                        step++;
                        // Update Loader
                        const txt = loader ? loader.querySelector('div:last-child') : null;
                        if(txt) txt.innerText = `데이터 불러오는 중... (Step ${step})`;
                        // Loop again
                        continue;
                    } else {
                        console.warn("[refreshDB] Continue status without token?");
                        break; 
                    }
                } else if (!response.status || response.status === 'completed') {
                    // Done
                    break;
                } else {
                    // Unknown Status?
                    console.warn("[refreshDB] Unknown Status:", response.status);
                    break;
                }
            } else {
                 // Unknown format
                 console.warn("Unknown API Response:", response);
                 break;
            }
        }

        renderGrid(allSeries);
        showToast("📚 라이브러리 업데이트 완료");

    } catch (e) {
        console.error("Library Fetch Error:", e);
        showToast(`❌ 로드 실패: ${e.message}`, 5000);
    } finally {
        if(loader) loader.style.display = 'none';
        if(btn) btn.classList.remove('spin-anim');
    }
}

// ============================================================
// 3. UI Rendering (Grid)
// ============================================================
/**
 * 시리즈 목록 데이터를 기반으로 만화 책자(그리드)를 렌더링합니다.
 * 각 카드는 클릭 시 에피소드 목록(`openEpisodeList`)을 엽니다.
 * 
 * @param {Array<Object>} seriesList - 시리즈 객체 배열
 */
function renderGrid(seriesList) {
    // Safety: Ensure seriesList is an array
    if (Array.isArray(seriesList)) {
        allSeries = seriesList;
    } else {
        console.warn("[renderGrid] Expected array but got:", seriesList);
        allSeries = [];
    }

    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!allSeries || allSeries.length === 0) {
        grid.innerHTML = '<div class="no-data">저장된 작품이 없습니다.</div>';
        return;
    }

    allSeries.forEach((series, index) => {
        const thumb = series.thumbnailId
            ? `https://googleusercontent.com/profile/picture/0${series.thumbnailId}=s400`
            : NO_IMAGE_SVG;

        const meta = series.metadata || {};
        const category = series.category || meta.category || 'Webtoon';

        // 작은따옴표 이스케이프 (onclick 문자열 안전)
        const safeName = (series.name || '').replace(/'/g, "\\'");

        const card = document.createElement('div');
        card.className = 'card';

        // 원래 의도: (1) 드라이브 (2) 목록열기(최근기록 저장 포함) (3) 사이트(있을 때)
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumb}" class="thumb" onerror="this.src='${NO_IMAGE_SVG}'">
                <div class="overlay">
                    <a href="https://drive.google.com/drive/u/0/folders/${series.id}" target="_blank" class="btn btn-drive">📂 드라이브</a>

                    <button
                        onclick="try{ saveReadHistory('${series.id}', '${safeName}'); }catch(e){}; openEpisodeList('${series.id}', '${safeName}', ${index});"
                        class="btn"
                        style="background:#444; color:white;"
                    >📄 목록</button>

                    ${series.sourceId ? `<a href="${getDynamicLink(series)}" target="_blank" class="btn btn-site">🌐 사이트</a>` : ''}
                </div>
            </div>

            <div class="info">
                <div class="title" style="font-weight:bold; font-size:15px; margin-bottom:2px;">${series.name || ''}</div>
                <div class="author" style="font-size:12px; color:#aaa; margin-bottom:8px;">
                    ${(meta.authors && Array.isArray(meta.authors) ? meta.authors.join(', ') : '작가 미상')}
                </div>
                <div class="meta" style="display:flex; justify-content:space-between; border-top:1px solid #333; padding-top:8px;">
                    <span style="font-size:11px; font-weight:bold; color:var(--accent);">${String(category).toUpperCase()}</span>
                    <span style="font-size:11px; color:#eee;">
                        ${meta.status || 'ONGOING'} ${series.booksCount || 0}권
                    </span>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}


// ============================================================
// 4. Utility / UI Handlers
// ============================================================
/**
 * 토스트 메시지를 화면 하단에 표시합니다.
 * @param {string} msg - 메시지 내용
 * @param {number} [duration=3000] - 지속 시간 (ms)
 */
function showToast(msg, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * 설정 모달의 '저장' 버튼 핸들러입니다.
 * 입력된 URL과 ID를 저장하고 데이터를 새로고침합니다.
 */
function saveManualConfig() {
    const url = document.getElementById('configApiUrl').value.trim();
    const id = document.getElementById('configFolderId').value.trim();
    
    if (!url || !id) return alert("값을 모두 입력해주세요.");
    
    API.setConfig(url, id);
    document.getElementById('configModal').style.display = 'none';
    refreshDB();
}

/**
 * 검색창 입력 이벤트 핸들러.
 * `allSeries`에서 제목을 검색하여 그리드를 필터링합니다.
 */
// 🚀 Global State
let currentTab = 'all'; // 'all', 'Webtoon', 'Manga', 'Novel'

// ... (Existing Init Code) ...

/**
 * 탭을 전환하고 리스트를 필터링합니다.
 * @param {string} tabName - 'all', 'Webtoon', 'Manga', 'Novel'
 */
function switchTab(tabName) {
    currentTab = tabName;
    
    // UI Update
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.innerText === getTabLabel(tabName)) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // Re-filter
    filterData();
}

function getTabLabel(key) {
    if (key === 'all') return '전체';
    if (key === 'Webtoon') return '웹툰';
    if (key === 'Manga') return '만화';
    if (key === 'Novel') return '소설';
    return '';
}

/**
 * 검색창 입력 및 탭 선택에 따라 그리드를 필터링합니다.
 */
function filterData() {
    const query = document.getElementById('search').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        const series = allSeries[index];
        const meta = series.metadata || { authors: [] };
        const authors = meta.authors || [];
        const text = (series.name + (authors.join(' '))).toLowerCase();
        
        // 1. Text Search
        const matchText = text.includes(query);
        
        // 2. Category Filter
        // Note: Server returns 'category' in metadata or root object
        const cat = series.category || (series.metadata ? series.metadata.category : 'Unknown');
        const matchTab = (currentTab === 'all') || (cat === currentTab) || 
                         (currentTab === 'Webtoon' && cat === 'Webtoon') || // Legacy Compat
                         (currentTab === 'Manga' && cat === 'Manga');

        card.style.display = (matchText && matchTab) ? 'flex' : 'none';
    });
}

// ============================================================
// 5. Settings / Config Logic
// ============================================================
function saveActiveSettings() {
    // 1. Save Domain Numbers
    const domains = {
        newtoki: document.getElementById('url_newtoki').value.trim() || DEFAULT_DOMAINS.newtoki,
        manatoki: document.getElementById('url_manatoki').value.trim() || DEFAULT_DOMAINS.manatoki,
        booktoki: document.getElementById('url_booktoki').value.trim() || DEFAULT_DOMAINS.booktoki
    };
    localStorage.setItem('toki_domains', JSON.stringify(domains));

    // 2. Save Connection Settings
    const folderId = document.getElementById('setting_folderId').value.trim();
    const deployId = document.getElementById('setting_deployId').value.trim();
    
    if (folderId && deployId) {
        const apiUrl = `https://script.google.com/macros/s/${deployId}/exec`;
        API.setConfig(apiUrl, folderId);
        showToast("☁️ 서버 연결 설정이 업데이트되었습니다.");
    }

    // 3. Save Viewer Preferences
    const vMode = document.getElementById('pref_2page').checked ? '2page' : '1page';
    const vCover = document.getElementById('pref_cover').checked;
    const vRtl = document.getElementById('pref_rtl').checked;
    const vEngine = document.querySelector('input[name="view_engine"]:checked').value;

    localStorage.setItem('toki_v_mode', vMode);
    localStorage.setItem('toki_v_cover', vCover);
    localStorage.setItem('toki_v_rtl', vRtl);
    localStorage.setItem('toki_v_engine', vEngine);

    // UI Feedback
    document.getElementById('domainPanel').style.display = 'none';
    showToast("✅ 설정이 저장되었습니다.");
    
    // Refresh Grid (for Links) and maybe DB if config changed
    renderGrid(allSeries);
    if(folderId && deployId) refreshDB();
}

function loadDomains() {
    // 1. Load Domains
    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    const elNew = document.getElementById('url_newtoki');
    const elMana = document.getElementById('url_manatoki');
    const elBook = document.getElementById('url_booktoki');
    
    if(elNew) elNew.value = saved.newtoki;
    if(elMana) elMana.value = saved.manatoki;
    if(elBook) elBook.value = saved.booktoki;

    // 2. Load Connection Settings
    const elFolder = document.getElementById('setting_folderId');
    const elDeploy = document.getElementById('setting_deployId');
    
    if (API.folderId && elFolder) elFolder.value = API.folderId;
    if (API.baseUrl && elDeploy) {
        // Extract Deployment ID from URL
        const match = API.baseUrl.match(/\/s\/([^\/]+)\/exec/);
        if (match && match[1]) elDeploy.value = match[1];
    }

    // 3. Load Viewer Preferences
    const vMode = localStorage.getItem('toki_v_mode') || '1page';
    const vCover = (localStorage.getItem('toki_v_cover') === 'true');
    const vRtl = (localStorage.getItem('toki_v_rtl') === 'true');
    const vEngine = localStorage.getItem('toki_v_engine') || 'legacy'; // Default to Legacy (Rollback)

    if(document.getElementById('pref_2page')) document.getElementById('pref_2page').checked = (vMode === '2page');
    if(document.getElementById('pref_cover')) document.getElementById('pref_cover').checked = vCover;
    if(document.getElementById('pref_rtl')) document.getElementById('pref_rtl').checked = vRtl;
    
    // Set Radio
    const radios = document.getElementsByName('view_engine');
    for(const r of radios) {
        r.checked = (r.value === vEngine);
    }
}

function getDynamicLink(series) {
    const contentId = series.sourceId;
    // Defensive Category Check
    let cat = series.category || (series.metadata ? series.metadata.category : '');
    const site = (series.name || "").toLowerCase();

    // Fallback if category is missing
    if (!cat) {
        if (site.includes("북토끼")) cat = "Novel";
        else if (site.includes("마나토끼")) cat = "Manga";
        else cat = "Webtoon";
    }

    const saved = JSON.parse(localStorage.getItem('toki_domains')) || DEFAULT_DOMAINS;
    
    // Default: Webtoon (NewToki)
    let baseUrl = `https://newtoki${saved.newtoki}.com`;
    let path = "/webtoon/";

    if (cat === "Novel") { 
        baseUrl = `https://booktoki${saved.booktoki}.com`; 
        path = "/novel/"; 
    }
    else if (cat === "Manga") { 
        baseUrl = `https://manatoki${saved.manatoki}.net`; 
        path = "/comic/"; 
    }

    return contentId ? (baseUrl + path + contentId) : "#";
}

/**
 * 도메인 설정 패널을 토글(열기/닫기)합니다.
 */
function toggleSettings() {
    const el = document.getElementById('domainPanel');
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ============================================================
// [Fix] Viewer interaction bindings (works even if viewer DOM is created later)
// ============================================================
function getViewerControlsEl() {
  return document.getElementById('viewerControls') || document.querySelector('.viewer-controls');
}

function bindViewerContentDelegates() {
  const viewerContent =
    document.getElementById('viewerContent') || document.querySelector('.viewer-content');
  if (!viewerContent || viewerContent.__tokiBound) return;

  viewerContent.__tokiBound = true;

  // Helper: determine if we are in scroll mode (image scroll or epub scroll)
  const isScrollMode = () => {
    const vc = viewerContent;
    if (vc && vc.classList && vc.classList.contains('scroll-mode')) return true;

    const vsc = document.getElementById('viewerScrollContainer');
    if (vsc && vsc.classList) {
      if (vsc.classList.contains('scroll-mode')) return true;
      if (vsc.classList.contains('scroll-mode')) return true; // only when explicitly in scroll mode
    }

    return false;
  };

  const getXPercent = (e) => {
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    if (!clientX || !window.innerWidth) return 50;
    return (clientX / window.innerWidth) * 100;
  };

  const shouldIgnoreTarget = (e) => {
    const t = e.target;
    if (!t) return false;
    // Ignore clicks on actual UI elements
    return Boolean(
      t.closest &&
        (t.closest('button') ||
          t.closest('input') ||
          t.closest('a') ||
          t.closest('.viewer-header') ||
          t.closest('.viewer-footer') ||
          t.closest('.viewer-controls'))
    );
  };

  const toggleBars = () => {
    const controls = getViewerControlsEl();
    if (controls) controls.classList.toggle('show');
  };

  const zoneHandler = (e) => {
    // 1) If viewer.js provides its own handler, let it run first.
    if (typeof window.handleInteraction === 'function') {
      window.handleInteraction(e);
      // If handleInteraction already consumed the event, do not double-handle.
      if (e.defaultPrevented) return;
    }

    // 2) Our fallback: only in paged (non-scroll) modes.
    if (isScrollMode()) return;
    if (shouldIgnoreTarget(e)) return;

    const x = getXPercent(e);
    const LEFT = 30;
    const RIGHT = 70;

    // Center: toggle bars
    if (x >= LEFT && x <= RIGHT) {
      toggleBars();
      e.preventDefault?.();
      e.stopPropagation?.();
      return;
    }

    // Sides: page navigation (if available)
    if (typeof window.navigateViewer === 'function') {
      if (x < LEFT) window.navigateViewer(-1);
      else if (x > RIGHT) window.navigateViewer(1);

      // Optionally show bars briefly? (leave as-is)
      e.preventDefault?.();
      e.stopPropagation?.();
    }
  };

  // Capture phase so we can reliably catch taps even if content is layered.
  viewerContent.addEventListener('click', zoneHandler, true);
  viewerContent.addEventListener('touchstart', zoneHandler, { passive: false, capture: true });
}
function bindTextCenterTap(container) {
  if (!container || container.__tokiTextBound) return;
  container.__tokiTextBound = true;

  const LEFT = 35;
  const RIGHT = 65;

  const toggleBars = (e) => {
    const t = e.target;

    // If the user actually clicked on UI controls, ignore.
    if (
      t &&
      (t.closest('.viewer-header') ||
        t.closest('.viewer-footer') ||
        t.closest('button') ||
        t.closest('input') ||
        t.closest('a'))
    ) {
      return;
    }

    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const xPercent = (clientX / window.innerWidth) * 100;

    // Only center tap toggles the bars.
    if (xPercent >= LEFT && xPercent <= RIGHT) {
      const controls = getViewerControlsEl();
      if (controls) controls.classList.toggle('show');

      e.preventDefault?.();
      e.stopPropagation?.();
    }
  };

  container.addEventListener('click', toggleBars, true);
  container.addEventListener('touchstart', toggleBars, { passive: false, capture: true });
}

function watchViewerDomAndBind() {
  const tryBind = () => {
    bindViewerContentDelegates();

    // If the text-engine uses `.text-*` touch zones, alias them to the legacy
    // class names so existing navigation logic keeps working.
    aliasTextTouchZones();

    // Text/EPUB containers can vary by engine.
    // 1) Legacy/Foliate container (#viewerScrollContainer.epub-mode)
    const scrollEl = document.getElementById('viewerScrollContainer');
    if (scrollEl && (scrollEl.classList.contains('epub-mode') || scrollEl.querySelector('.epub-content'))) {
      bindTextCenterTap(scrollEl);
      return;
    }

    // 2) New text viewer engine container (.book-container)
    const bookEl = document.querySelector('.book-container');
    if (bookEl && getComputedStyle(bookEl).display !== 'none') {
      bindTextCenterTap(bookEl);
      return;
    }

    // 3) Fallback: bind to viewerContent, but only toggle on center taps.
    const viewerContent = document.getElementById('viewerContent');
    if (viewerContent) bindTextCenterTap(viewerContent);
  };

  tryBind();

  // Viewer DOM often gets created after initial load (when opening an episode),
  // so we observe DOM mutations and bind once the nodes appear.
  const obs = new MutationObserver(() => tryBind());
  obs.observe(document.body, { childList: true, subtree: true });
}

function aliasTextTouchZones() {
  const zones = document.querySelectorAll('.text-side-tap, .text-left-tap, .text-right-tap');
  zones.forEach((el) => {
    // Keep existing class, add legacy aliases
    if (el.classList.contains('text-side-tap')) el.classList.add('side-tap');
    if (el.classList.contains('text-left-tap')) el.classList.add('left-tap');
    if (el.classList.contains('text-right-tap')) el.classList.add('right-tap');
  });
}

/**
 * [Mobile/Paged Fix] If viewer renders 2-page spread containers with one empty side,
 * collapse the empty side so a single page is centered/full-width on small screens.
 * This is CSS-agnostic and works for both Webtoon(image) and Text(book) paged modes.
 */
function normalizeSinglePageSpread() {
  try {
    const spreads = document.querySelectorAll('.viewer-spread');
    spreads.forEach((sp) => {
      const halves = Array.from(sp.querySelectorAll(':scope > div.half'));
      if (halves.length < 2) return;

      const hasImg = halves.map(h => h.querySelector('img.viewer-page, img'));
      const fullIdx = hasImg.findIndex(Boolean);
      const emptyIdx = hasImg.findIndex(x => !x);

      // If exactly one side has an image and the other is empty -> collapse
      if (fullIdx !== -1 && emptyIdx !== -1) {
        const full = halves[fullIdx];
        const empty = halves[emptyIdx];

        empty.style.display = 'none';
        full.style.flex = '0 0 100%';
        full.style.width = '100%';
        full.style.maxWidth = '100%';

        // Keep the image centered
        const img = full.querySelector('img');
        if (img) {
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
        }
      } else {
        // Reset if both sides have content
        halves.forEach(h => {
          h.style.display = '';
          h.style.flex = '';
          h.style.width = '';
          h.style.maxWidth = '';
        });
      }
    });
  } catch (e) {
    console.warn('[normalizeSinglePageSpread] failed', e);
  }
}


// [수정] main.js 초기화 블록
window.addEventListener('DOMContentLoaded', () => {
  // Bind viewer interactions (delegated + mutation-safe)
  watchViewerDomAndBind();

  // Handshake
  window.addEventListener('message', handleMessage, false);

  const verEl = document.getElementById('viewerVersionDisplay');
  if (verEl) verEl.innerText = `Viewer Version: ${VIEWER_VERSION}`;

  // Existing boot logic
  if (API.isConfigured()) {
    loadDomains();
    refreshDB(null, true);
  } else {
    setTimeout(() => {
      if (!API.isConfigured()) {
        const cm = document.getElementById('configModal');
        if (cm) cm.style.display = 'flex';
      } else {
        refreshDB(null, true);
      }
      loadDomains();
    }, 1000);
  }
});
// 🚀 Expose Globals for HTML onclick & Modules
window.refreshDB = refreshDB;
window.toggleSettings = toggleSettings;
window.switchTab = switchTab;
window.filterData = filterData;
window.saveActiveSettings = saveActiveSettings;
window.saveManualConfig = saveManualConfig;
window.showToast = showToast; // Used by viewer?
window.renderGrid = renderGrid; // Debugging

window.saveReadHistory = async function(seriesId, seriesName) {
    try {
        await API.request('view_save_bookmark', {
            folderId: API.folderId, seriesId: seriesId, name: seriesName, time: new Date().getTime()
        });
        loadHistory();
    } catch (e) { console.log("기록 저장 실패"); }
};

async function loadHistory() {
    const container = document.getElementById('recentList');
    if (!container) return;
    try {
        const res = await API.request('view_get_bookmarks', { folderId: API.folderId });
        if (!res) return;
        container.innerHTML = '';
        Object.values(res).sort((a,b) => b.time - a.time).slice(0, 6).forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerText = `📖 ${item.name}`;
            div.onclick = () => openEpisodeList(item.seriesId, item.name, 0);
            container.appendChild(div);
        });
    } catch (e) { console.log("기록 로드 실패"); }


    /* ============================
 * Paged(좌우 넘김) 모드: 탭 내비 + 중앙 토글 + 리사이즈 스냅 + 폰트 버튼 복구
 * ============================ */
(function () {
  const STATE = {
    fontPx: parseInt(localStorage.getItem("toki_font_px") || "18", 10),
  };

  function qs(id) { return document.getElementById(id); }

  function getScrollEl() {
    // EPUB/텍스트는 보통 viewerScrollContainer를 씁니다.
    return qs("viewerScrollContainer");
  }

  function getControlsEl() {
    // 검정 바 컨트롤 레이어 id가 viewerControls인 것으로 보입니다.
    return qs("viewerControls");
  }

  function isViewerOpen() {
    const ov = qs("viewerOverlay");
    return !!(ov && ov.style && ov.style.display !== "none");
  }

  function isPagedMode() {
    const scrollEl = getScrollEl();
    if (!scrollEl) return false;

    // paged-mode 클래스 또는 epub-content.paged-view 존재로 판정
    if (scrollEl.classList.contains("paged-mode")) return true;
    const pagedContent = scrollEl.querySelector(".epub-content.paged-view");
    return !!pagedContent;
  }

  function pageWidth() {
    // paged 모드 기준 폭: scrollEl의 clientWidth(가장 안정적)
    const scrollEl = getScrollEl();
    if (!scrollEl) return window.innerWidth;
    return scrollEl.clientWidth || window.innerWidth;
  }

  function snapToNearestPage() {
    const scrollEl = getScrollEl();
    if (!scrollEl || !isPagedMode()) return;

    const w = pageWidth();
    if (!w) return;

    const current = scrollEl.scrollLeft || 0;
    const page = Math.round(current / w);
    const target = page * w;

    scrollEl.scrollLeft = target;
  }

  function pagedNavigate(dir) {
    const scrollEl = getScrollEl();
    if (!scrollEl || !isPagedMode()) return;

    const w = pageWidth();
    if (!w) return;

    // 현재 페이지 기준으로 한 페이지 이동
    const current = scrollEl.scrollLeft || 0;
    const page = Math.round(current / w);
    const next = Math.max(0, page + dir);
    scrollEl.scrollLeft = next * w;
  }

  function toggleBars() {
    const controls = getControlsEl();
    if (!controls) return;
    controls.classList.toggle("show");
  }

  function ensureTapZones() {
    // viewer-content 위에 강제로 탭존을 올립니다.
    const viewerContent = qs("viewerContent");
    if (!viewerContent) return;

    let wrap = viewerContent.querySelector(".tapzones-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "tapzones-wrap";
      viewerContent.appendChild(wrap);

      const left = document.createElement("div");
      left.className = "tapzone left";

      const mid = document.createElement("div");
      mid.className = "tapzone mid";

      const right = document.createElement("div");
      right.className = "tapzone right";

      wrap.appendChild(left);
      wrap.appendChild(mid);
      wrap.appendChild(right);

      const stop = (e) => {
        // 버튼/인풋 위에서 탭은 무시
        const t = e.target;
        if (t && (t.tagName === "BUTTON" || t.tagName === "INPUT" || t.closest("button") || t.closest("input"))) return false;
        e.preventDefault?.();
        e.stopPropagation?.();
        return true;
      };

      // 좌/우는 페이지 넘김, 중앙은 바 토글
      left.addEventListener("click", (e) => { if (!stop(e)) return; pagedNavigate(-1); }, true);
      right.addEventListener("click", (e) => { if (!stop(e)) return; pagedNavigate(1); }, true);
      mid.addEventListener("click", (e) => { if (!stop(e)) return; toggleBars(); }, true);

      // 모바일 터치 대응
      left.addEventListener("touchstart", (e) => { if (!stop(e)) return; pagedNavigate(-1); }, { passive: false, capture: true });
      right.addEventListener("touchstart", (e) => { if (!stop(e)) return; pagedNavigate(1); }, { passive: false, capture: true });
      mid.addEventListener("touchstart", (e) => { if (!stop(e)) return; toggleBars(); }, { passive: false, capture: true });
    }
  }

  function applyFontPx(px) {
    STATE.fontPx = Math.max(12, Math.min(40, px));
    localStorage.setItem("toki_font_px", String(STATE.fontPx));

    const scrollEl = getScrollEl();
    if (!scrollEl) return;

    // Foliate/Legacy EPUB 공통: epub-content 전체에 폰트 사이즈 적용
    const targets = scrollEl.querySelectorAll(".epub-content, .epub-content *");
    targets.forEach(el => {
      // 너무 과격하면 .epub-content에만 적용하도록 바꿔도 됨
      el.style.fontSize = STATE.fontPx + "px";
      el.style.lineHeight = "1.8";
    });
  }

  function wireFontButtons() {
    // 버튼 텍스트가 "가-" "가+" 인 것으로 보이므로 텍스트로 잡아 붙입니다.
    // (ID가 없어서 이 방식이 가장 안전)
    const controls = getControlsEl();
    if (!controls) return;

    const btns = controls.querySelectorAll("button, .btn-toggle");
    btns.forEach(b => {
      const txt = (b.innerText || "").trim();
      if (txt === "가-") {
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); applyFontPx(STATE.fontPx - 2); };
      }
      if (txt === "가+") {
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); applyFontPx(STATE.fontPx + 2); };
      }
    });
  }

  // 뷰어 열릴 때마다 탭존/폰트 버튼/스냅 강제
  function onTick() {
    if (!isViewerOpen()) return;

    ensureTapZones();
    wireFontButtons();

    // 오른쪽 쏠림의 핵심: 현재 scrollLeft를 “현재 폭”에 맞게 스냅
    if (isPagedMode()) snapToNearestPage();
  }

  // 초기/리사이즈 스냅
  window.addEventListener("resize", () => {
    if (!isViewerOpen()) return;
    if (isPagedMode()) snapToNearestPage();
  });

  // 주기적으로 뷰어 상태를 감지 (viewer open 훅을 확실히 모르므로 안전하게 polling)
  setInterval(onTick, 400);

  // 최초 폰트 적용
  document.addEventListener("DOMContentLoaded", () => {
    applyFontPx(STATE.fontPx);
  });
})();

}
