const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_ROOT_FOLDER_NAME = 'SUR420 Voice Note Submissions';
const AUDIO_TYPES = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Upload')
    .setTitle('SUR420 Voice Note Upload')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function uploadVoiceNote(form) {
  if (form.website) {
    return 'Thank you. Your voice note has been received for review.';
  }

  const name = String(form.name || '').trim();
  const email = String(form.email || '').trim();
  const file = form.voiceNote;

  if (!name || name.length > 100) {
    throw new Error('Please enter your name (up to 100 characters).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Please enter a valid email address.');
  }
  if (!file || typeof file.getName !== 'function' || !file.getName()) {
    throw new Error('Please choose an audio file to upload.');
  }

  const originalName = file.getName();
  const extension = originalName.split('.').pop().toLowerCase();
  const contentType = AUDIO_TYPES[extension];
  if (!contentType) {
    throw new Error('Please upload an MP3, WAV, M4A, or OGG audio file.');
  }

  const bytes = file.getBytes();
  if (bytes.length === 0 || bytes.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('The audio file must be smaller than 10 MB.');
  }

  const folder = getUploadRootFolder_().createFolder(
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')
      + '-' + sanitizeFolderName_(name) + '-' + Utilities.getUuid().slice(0, 8)
  );
  const safeFileName = sanitizeFileName_(originalName);
  const audioBlob = Utilities.newBlob(bytes, contentType, safeFileName);
  folder.createFile(audioBlob);
  folder.setDescription('Submitted by: ' + name + '\nEmail: ' + email);

  return 'Thank you. Your voice note has been received for review.';
}

function getUploadRootFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty('UPLOAD_ROOT_FOLDER_ID');
  if (existingId) {
    return DriveApp.getFolderById(existingId);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const folderId = properties.getProperty('UPLOAD_ROOT_FOLDER_ID');
    if (folderId) {
      return DriveApp.getFolderById(folderId);
    }

    const folder = DriveApp.createFolder(UPLOAD_ROOT_FOLDER_NAME);
    properties.setProperty('UPLOAD_ROOT_FOLDER_ID', folder.getId());
    return folder;
  } finally {
    lock.releaseLock();
  }
}

function sanitizeFolderName_(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'singer';
}

function sanitizeFileName_(value) {
  return value.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 150);
}
