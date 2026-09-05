import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractText = async (file) => {
    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    if (extension === ".pdf") {

        const parser = new PDFParse({
            data: file.buffer
        });

        const result = await parser.getText();

        await parser.destroy();

        return result.text;
    }


    if (extension === ".docx") {

        const result = await mammoth.extractRawText({
            buffer: file.buffer
        });

        return result.value;
    }


    throw new Error(
        `Unsupported file type: ${extension}`
    );
};
