import path from "path";
import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".xlsx", ".xls", ".csv", ".json", ".pdf"];

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type! Excel, JSON, CSV, and PDF are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

export default upload;
