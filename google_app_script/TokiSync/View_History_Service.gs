// =======================================================
// 📚 Viewer History/Bookmark Service
// =======================================================

const HISTORY_FILE_NAME = "toki_history.json";

/**
 * 북마크/히스토리 저장
 * @param {Object} data
 * @param {string} rootFolderId
 */
function View_saveBookmark(data, rootFolderId) {
  const root = DriveApp.getFolderById(rootFolderId);
  let file;
  const files = root.getFilesByName(HISTORY_FILE_NAME);

  if (files.hasNext()) {
    file = files.next();
  } else {
    file = root.createFile(HISTORY_FILE_NAME, "{}", MimeType.PLAIN_TEXT);
  }

  let history = {};
  try {
    const content = file.getBlob().getDataAsString();
    history = JSON.parse(content || "{}");
  } catch (e) {
    history = {};
  }

  history[data.seriesId] = {
    seriesId: data.seriesId,
    name: data.name || "Unknown",
    epId: data.epId,
    page: data.page || 0,
    time: new Date().getTime(),
  };

  file.setContent(JSON.stringify(history));
  return history;
}

/**
 * 북마크/히스토리 로드
 * @param {string} rootFolderId
 */
function View_getRecentBookmarks(rootFolderId) {
  const root = DriveApp.getFolderById(rootFolderId);
  const files = root.getFilesByName(HISTORY_FILE_NAME);

  if (files.hasNext()) {
    try {
      const content = files.next().getBlob().getDataAsString();
      return JSON.parse(content);
    } catch (e) {
      return {};
    }
  }
  return {};
}
