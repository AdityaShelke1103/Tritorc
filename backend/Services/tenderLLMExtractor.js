import OpenAI from "openai";


const emptyResult = {
    technicalQualification: "",
    financialQualification: "",
    scopeOfWork: "",
    tenderSummary: "",
    tenderDescription: "",
    corrigendum: "",
    purchaserAddress: "",
    location: ""
};

export const enrichTenderData = async (text) => {
    if (
        process.env.ENABLE_LLM !== "true" ||
        !process.env.OPENAI_API_KEY
    ) {
        return emptyResult;
    }

    try {
        const response = await client.responses.create({
            model: "gpt-5-mini",

            input: [
                {
                    role: "system",
                    content: `
You are a tender document information extraction system.

Extract information ONLY from the supplied tender document.

Return ONLY valid JSON with exactly these fields:

{
    "technicalQualification": "",
    "financialQualification": "",
    "scopeOfWork": "",
    "tenderSummary": "",
    "tenderDescription": "",
    "corrigendum": "",
    "purchaserAddress": "",
    "location": ""
}

Rules:
- Do not invent or infer information that is not present.
- If a field is not present, return an empty string.
- Preserve important details from the document.
- Technical qualification should contain eligibility/technical requirements.
- Financial qualification should contain turnover, financial capacity, solvency,
  financial eligibility or similar requirements.
- Scope of work should describe what work/goods/services are required.
- Tender summary should be a concise summary of the tender.
- Tender description should describe the tender/item and its purpose.
- Corrigendum should contain corrigendum/amendment information if present.
- Purchaser address should contain the relevant purchaser/buyer/consignee address.
- Location should contain the relevant tender/work/delivery location.
- Do not use markdown.
`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });

        const output = response.output_text;

        const parsed = JSON.parse(output);

        return {
            technicalQualification:
                parsed.technicalQualification || "",

            financialQualification:
                parsed.financialQualification || "",

            scopeOfWork:
                parsed.scopeOfWork || "",

            tenderSummary:
                parsed.tenderSummary || "",

            tenderDescription:
                parsed.tenderDescription || "",

            corrigendum:
                parsed.corrigendum || "",

            purchaserAddress:
                parsed.purchaserAddress || "",

            location:
                parsed.location || ""
        };

    } catch (error) {
        console.error(
            "LLM enrichment failed:",
            error.message
        );

        return emptyResult;
    }
};