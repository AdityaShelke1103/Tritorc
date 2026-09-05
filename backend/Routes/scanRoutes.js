import express from "express";
import upload from "../Middleware/uploadMiddleware.js";

import {
    scanDocuments,
    downloadExcel
} from "../Controllers/scanController.js";

const router = express.Router();

router.post(
    "/",
    upload.array("documents", 10),
    scanDocuments
);

router.get(
    "/excel",
    downloadExcel
);

export default router;