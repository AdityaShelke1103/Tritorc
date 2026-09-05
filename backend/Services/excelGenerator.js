import ExcelJS from "exceljs";

export const generateExcel = async (scans) => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet(
        "Tritorc Relevance Report"
    );

    worksheet.columns = [
        {
            header: "Document Name",
            key: "documentName",
            width: 30
        },
        {
            header: "Tender ID",
            key: "tenderId",
            width: 25
        },
        {
            header: "Tender No",
            key: "tenderNo",
            width: 25
        },
        {
            header: "Tender Authority",
            key: "tenderAuthority",
            width: 35
        },
        {
            header: "Location",
            key: "location",
            width: 25
        },
        {
            header: "Opening Date",
            key: "openingDate",
            width: 25
        },
        {
            header: "Closing Date",
            key: "closingDate",
            width: 25
        },
        {
            header: "Tender Amount",
            key: "tenderAmount",
            width: 25
        },
        {
            header: "EMD",
            key: "emd",
            width: 25
        },
        {
            header: "Document Cost",
            key: "documentCost",
            width: 25
        },
        {
            header: "Tender Fee",
            key: "tenderFee",
            width: 25
        },
        {
            header: "Tab Name",
            key: "tabName",
            width: 30
        },
        {
            header: "Technical Qualification",
            key: "technicalQualification",
            width: 50
        },
        {
            header: "Financial Qualification",
            key: "financialQualification",
            width: 50
        },
        {
            header: "Scope of Work",
            key: "scopeOfWork",
            width: 60
        },
        {
            header: "Tender Summary",
            key: "tenderSummary",
            width: 60
        },
        {
            header: "Tender Description",
            key: "tenderDescription",
            width: 60
        },
        {
            header: "Corrigendum",
            key: "corrigendum",
            width: 50
        },
        {
            header: "Purchaser Address",
            key: "purchaserAddress",
            width: 45
        },
        {
            header: "Email",
            key: "email",
            width: 35
        },
        {
            header: "Website",
            key: "website",
            width: 40
        },
        {
            header: "Matched Keywords",
            key: "matchedKeywords",
            width: 60
        },
        {
            header: "Match Count",
            key: "matchCount",
            width: 15
        },
        {
            header: "Relevance to Tritorc",
            key: "relevance",
            width: 25
        }
    ];


    for (const scan of scans) {
        worksheet.addRow({
            documentName: scan.documentName || "",

            tenderId: scan.tenderId || "",

            tenderNo: scan.tenderNo || "",

            tenderAuthority:
                scan.tenderAuthority || "",

            location:
                scan.location || "",

            openingDate:
                scan.openingDate || "",

            closingDate:
                scan.closingDate || "",

            tenderAmount:
                scan.tenderAmount || "",

            emd:
                scan.emd || "",

            documentCost:
                scan.documentCost || "",

            tenderFee:
                scan.tenderFee || "",

            tabName:
                scan.tabName || "",

            technicalQualification:
                scan.technicalQualification || "",

            financialQualification:
                scan.financialQualification || "",

            scopeOfWork:
                scan.scopeOfWork || "",

            tenderSummary:
                scan.tenderSummary || "",

            tenderDescription:
                scan.tenderDescription || "",

            corrigendum:
                scan.corrigendum || "",

            purchaserAddress:
                scan.purchaserAddress || "",

            email:
                scan.email || "",

            website:
                scan.website || "",

            matchedKeywords:
                scan.matchedKeywords?.join(", ") || "",

            matchCount:
                scan.matchCount || 0,

            relevance:
                scan.relevance || ""
        });
    }


    /*
        Header styling
    */
    const headerRow = worksheet.getRow(1);

    headerRow.font = {
        bold: true
    };

    headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
    };


    /*
        Wrap long text fields
    */
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.alignment = {
            vertical: "top",
            wrapText: true
        };
    });


    /*
        Freeze header row
    */
    worksheet.views = [
        {
            state: "frozen",
            ySplit: 1
        }
    ];


    /*
        Enable filtering
    */
    worksheet.autoFilter = {
        from: "A1",
        to: "X1"
    };


    return workbook;
};