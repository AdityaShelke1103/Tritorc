import mongoose from "mongoose";

const tenderScanSchema = new mongoose.Schema(
    {
        documentName: {
            type: String,
            required: true
        },

        tenderId: {
            type: String,
            default: ""
        },

        tenderNo: {
            type: String,
            default: ""
        },

        tenderAuthority: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: ""
        },

        openingDate: {
            type: String,
            default: ""
        },

        closingDate: {
            type: String,
            default: ""
        },

        tenderAmount: {
            type: String,
            default: ""
        },

        emd: {
            type: String,
            default: ""
        },

        documentCost: {
            type: String,
            default: ""
        },

        tenderFee: {
            type: String,
            default: ""
        },

        tabName: {
            type: String,
            default: ""
        },

        technicalQualification: {
            type: String,
            default: ""
        },

        financialQualification: {
            type: String,
            default: ""
        },

        scopeOfWork: {
            type: String,
            default: ""
        },

        tenderSummary: {
            type: String,
            default: ""
        },

        tenderDescription: {
            type: String,
            default: ""
        },

        corrigendum: {
            type: String,
            default: ""
        },

        purchaserAddress: {
            type: String,
            default: ""
        },

        email: {
            type: String,
            default: ""
        },

        website: {
            type: String,
            default: ""
        },

        matchedKeywords: {
            type: [String],
            default: []
        },

        matchCount: {
            type: Number,
            default: 0
        },

        score: {
            type: Number,
            default: 0
        },

        relevance: {
            type: String,
            enum: ["Related", "Possibly Related", "Not Related"],
            default: "Not Related"
        },

        scannedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const TenderScan = mongoose.model("TenderScan", tenderScanSchema);

export default TenderScan;