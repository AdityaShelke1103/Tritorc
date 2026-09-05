import { extractText } from "../Services/documentParser.js";
import { extractTenderData } from "../Services/tenderExtractor.js";
import { enrichTenderData } from "../Services/tenderLLMExtractor.js";
import { matchKeywords } from "../Services/keywordMatcher.js";
import { calculateRelevance } from "../Services/relevanceScorer.js";
import { generateExcel } from "../Services/excelGenerator.js";

import TenderScan from "../Models/tenderScan.js";


export const scanDocuments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No documents uploaded"
            });
        }

        const results = [];


        for (const file of req.files) {

            /*
                1. Extract raw text
            */
            const text = await extractText(file);


            /*
                2. Extract tender metadata
                   using deterministic extraction
            */
            const tenderData = extractTenderData(text);


            /*
                3. Enrich missing/unstructured fields
                   using LLM when enabled
            */
            const llmData = await enrichTenderData(text);


            /*
                4. Merge deterministic + LLM data

                Deterministic extraction gets priority.
                LLM is used only as a fallback.
            */
            const finalTenderData = {
                ...tenderData,

                technicalQualification:
                    tenderData.technicalQualification ||
                    llmData.technicalQualification,

                financialQualification:
                    tenderData.financialQualification ||
                    llmData.financialQualification,

                scopeOfWork:
                    tenderData.scopeOfWork ||
                    llmData.scopeOfWork,

                tenderSummary:
                    tenderData.tenderSummary ||
                    llmData.tenderSummary,

                tenderDescription:
                    tenderData.tenderDescription ||
                    llmData.tenderDescription,

                corrigendum:
                    tenderData.corrigendum ||
                    llmData.corrigendum,

                purchaserAddress:
                    tenderData.purchaserAddress ||
                    llmData.purchaserAddress,

                location:
                    tenderData.location ||
                    llmData.location
            };


            /*
                5. Match Tritorc keywords
            */
            const keywordResult = matchKeywords(text);


            /*
                6. Calculate relevance
            */
            const relevance = calculateRelevance(
                keywordResult.matchCount
            );


            /*
                7. Save complete result to MongoDB
            */
            const scan = await TenderScan.create({

                documentName: file.originalname,

                tenderId: finalTenderData.tenderId,
                tenderNo: finalTenderData.tenderNo,
                tenderAuthority: finalTenderData.tenderAuthority,
                location: finalTenderData.location,

                openingDate: finalTenderData.openingDate,
                closingDate: finalTenderData.closingDate,

                tenderAmount: finalTenderData.tenderAmount,
                emd: finalTenderData.emd,
                documentCost: finalTenderData.documentCost,
                tenderFee: finalTenderData.tenderFee,

                tabName: finalTenderData.tabName,

                technicalQualification:
                    finalTenderData.technicalQualification,

                financialQualification:
                    finalTenderData.financialQualification,

                scopeOfWork:
                    finalTenderData.scopeOfWork,

                tenderSummary:
                    finalTenderData.tenderSummary,

                tenderDescription:
                    finalTenderData.tenderDescription,

                corrigendum:
                    finalTenderData.corrigendum,

                purchaserAddress:
                    finalTenderData.purchaserAddress,

                email:
                    finalTenderData.email,

                website:
                    finalTenderData.website,

                matchedKeywords:
                    keywordResult.matchedKeywords,

                matchCount:
                    keywordResult.matchCount,

                score:
                    keywordResult.score,

                relevance
            });


            /*
                8. Return complete result to frontend
            */
            results.push({

                id: scan._id,

                documentName: scan.documentName,

                tenderId: scan.tenderId,
                tenderNo: scan.tenderNo,
                tenderAuthority: scan.tenderAuthority,
                location: scan.location,

                openingDate: scan.openingDate,
                closingDate: scan.closingDate,

                tenderAmount: scan.tenderAmount,
                emd: scan.emd,
                documentCost: scan.documentCost,
                tenderFee: scan.tenderFee,

                tabName: scan.tabName,

                technicalQualification:
                    scan.technicalQualification,

                financialQualification:
                    scan.financialQualification,

                scopeOfWork:
                    scan.scopeOfWork,

                tenderSummary:
                    scan.tenderSummary,

                tenderDescription:
                    scan.tenderDescription,

                corrigendum:
                    scan.corrigendum,

                purchaserAddress:
                    scan.purchaserAddress,

                email:
                    scan.email,

                website:
                    scan.website,

                matchedKeywords:
                    scan.matchedKeywords,

                matchCount:
                    scan.matchCount,

                score:
                    scan.score,

                relevance:
                    scan.relevance
            });
        }


        return res.status(200).json({
            success: true,
            message: "Documents scanned successfully",
            count: results.length,
            results
        });

    } catch (error) {

        console.error(
            "Document scanning error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to scan documents",
            error: error.message
        });
    }
};


export const downloadExcel = async (req, res) => {
    try {

        /*
            Get all previous scans
        */
        const scans = await TenderScan
            .find()
            .sort({ createdAt: -1 });


        if (scans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No scan results available"
            });
        }


        /*
            Generate workbook
        */
        const workbook = await generateExcel(scans);


        /*
            Excel response headers
        */
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="tritorc-relevance-report.xlsx"'
        );


        /*
            Send workbook
        */
        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(
            "Excel generation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate Excel report",
            error: error.message
        });
    }
};