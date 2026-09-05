import multer from "multer";
import path from "path";

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [".pdf", ".docx"];

    if (allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOCX files are allowed"));
    }
};

const upload = multer({
    storage: multer.memoryStorage(),

    fileFilter,

    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

export default upload;