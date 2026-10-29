import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration with randomized filename
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomHex}${ext}`);
  }
});

// Allowed file extensions and mimetypes
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.zip', '.tar', '.gz',
  '.txt', '.py', '.java', '.c', '.cpp', '.h', '.sql',
  '.png', '.jpg', '.jpeg', '.csv', '.json', '.md'
];

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not permitted. Permitted types: PDF, DOCX, ZIP, code, and text files.`));
    }
  }
});

export { UPLOAD_DIR };
