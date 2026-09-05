// const cleanValue = (value = "") => {
//     return value
//         .replace(/\s+/g, " ")
//         .replace(/^[\s:|-]+|[\s:|-]+$/g, "")
//         .trim();
// };

// const normalizeText = (text = "") => {
//     return text
//         .replace(/\r/g, "")
//         .replace(/\u00a0/g, " ")
//         .replace(/[ \t]+/g, " ")
//         .replace(/\n{3,}/g, "\n\n")
//         .trim();
// };

// const escapeRegex = (value) => {
//     return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// };

// // Values that show up right after a label match but are actually a
// // continuation of a section HEADER, not real data — e.g. matching "EMD"
// // inside the disclaimer sentence "...specifications, EMD Detail, ePBG
// // Detail and MII..." captures "Detail, ePBG Detail and MII..." which
// // LOOKS like a value but isn't. Checked as a prefix, not an exact match,
// // since the junk can have more text trailing after it.
// const NON_VALUE_CONTINUATION_PREFIX = /^(detail|details|information|info|section)\b/i;

// // Labels can also be split across lines in a way that makes the "next
// // line" itself just a fragment of the label rather than the value, e.g.:
// //   बड खुलने क तारख/समय /Bid Opening
// //   Date/Time
// //   03-08-2026 09:30:00
// // Here "Bid Opening" ends line 1, but line 2 ("Date/Time") is still part
// // of the label, not the answer. We skip over these fragments when
// // scanning forward for the real value.
// const LABEL_FRAGMENT_TOKENS = new Set([
//     "date", "time", "date/time", "no", "no.", "number",
//     "detail", "details", "info", "information"
// ]);

// const looksLikeLabelFragment = (value) => {
//     const normalized = value.toLowerCase().replace(/\s+/g, "");
//     return LABEL_FRAGMENT_TOKENS.has(normalized);
// };

// // Sometimes the leftover label fragment isn't alone on its own line —
// // it's glued to the front of the real value on the SAME line, e.g.:
// //   "Date/Time 03-08-2026 09:30:00"
// // where "Date/Time" is still part of the label and "03-08-2026 09:30:00"
// // is the actual answer. This regex strips a leading fragment token (plus
// // an optional separator) so what's left can be evaluated as the value.
// const LABEL_FRAGMENT_PREFIX_REGEX = new RegExp(
//     `^(?:${[...LABEL_FRAGMENT_TOKENS]
//         .sort((a, b) => b.length - a.length)
//         .map((token) => escapeRegex(token))
//         .join("|")})\\s*[:\\-]?\\s*(.*)$`,
//     "i"
// );

// // General sanity filter applied to anything extractLabelValue is about to
// // return. Because we now match labels ANYWHERE in a line (not just at the
// // start — needed for bilingual "Hindi/English Label" templates), a label
// // word can coincidentally appear mid-sentence in boilerplate/disclaimer
// // text. Real form-field values don't look like sentence fragments, so we
// // reject candidates that clearly aren't real answers:
// //   - too short to be meaningful (e.g. a stray ".")
// //   - no alphanumeric content at all
// //   - start with stray punctuation, meaning we grabbed the middle of a
// //     sentence (e.g. "/ Bid Participation fee, as the case may be.")
// //   - start with a leftover label-continuation word ("Detail", "Date/Time")
// const isLikelyRealValue = (value) => {
//     if (!value || value.length < 2) {
//         return false;
//     }

//     if (!/[A-Za-z0-9]/.test(value)) {
//         return false;
//     }

//     if (/^[^A-Za-z0-9₹$]/.test(value)) {
//         return false;
//     }

//     if (NON_VALUE_CONTINUATION_PREFIX.test(value)) {
//         return false;
//     }

//     return true;
// };

// const extractLabelValue = (text, labels) => {
//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     for (const label of labels) {
//         const escapedLabel = escapeRegex(label);

//         // NOTE: no leading "^" anchor. Bilingual tender templates (GeM,
//         // most Indian govt portals) prefix every English label with
//         // native-language text on the SAME line, e.g.:
//         //   "बड बंद होने क तारख/समय /Bid End Date/Time 03-08-2026 09:00:00"
//         // Anchoring to the start of the line means the label is never
//         // found, because the line doesn't literally start with it.
//         // We keep a leading \b so we don't match "label" as a substring
//         // of some unrelated word.
//         const sameLineRegex = new RegExp(
//             `\\b${escapedLabel}\\s*[:\\-]?\\s*(.+)$`,
//             "i"
//         );

//         for (let i = 0; i < lines.length; i++) {
//             const match = lines[i].match(sameLineRegex);

//             if (match && match[1]) {
//                 const value = cleanValue(match[1]);

//                 if (
//                     value.toLowerCase() !== label.toLowerCase() &&
//                     isLikelyRealValue(value)
//                 ) {
//                     return value;
//                 }
//             }
//         }

//         // Label sits alone at the END of its line (still possibly with a
//         // native-language prefix before it) and the actual value is one
//         // or more lines below, e.g.:
//         //   "बड सं?या/Bid Number"
//         //   ": GEM/2026/B/7824594"
//         // Sometimes the label itself spills onto the next line too
//         // ("...Bid Opening" then "Date/Time" then the real date) — skip
//         // over those fragments rather than grabbing the first line found.
//         const labelOnlyRegex = new RegExp(
//             `\\b${escapedLabel}\\s*$`,
//             "i"
//         );

//         for (let i = 0; i < lines.length; i++) {
//             if (!labelOnlyRegex.test(lines[i])) {
//                 continue;
//             }

//             for (let j = i + 1; j < lines.length && j < i + 4; j++) {
//                 let candidate = lines[j];

//                 // Strip a leftover label fragment (e.g. "Date/Time") off
//                 // the front of the line before evaluating it — the real
//                 // value may follow immediately after on the same line.
//                 const fragmentMatch = candidate.match(
//                     LABEL_FRAGMENT_PREFIX_REGEX
//                 );

//                 if (fragmentMatch) {
//                     candidate = cleanValue(fragmentMatch[1]);
//                 }

//                 if (!candidate) {
//                     // Whole line was just a fragment with nothing left —
//                     // keep scanning forward.
//                     continue;
//                 }

//                 if (
//                     candidate.toLowerCase() !== label.toLowerCase() &&
//                     isLikelyRealValue(candidate)
//                 ) {
//                     return candidate;
//                 }
//             }
//         }
//     }

//     return "";
// };

// const extractSection = (text, headings) => {
//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     const normalizedHeadings = headings.map((heading) =>
//         heading.toLowerCase().trim()
//     );

//     let collecting = false;
//     const section = [];

//     for (const line of lines) {
//         const lowerLine = line.toLowerCase();

//         const headingWithoutNumber = lowerLine.replace(
//             /^\d+\.\s*/,
//             ""
//         );

//         const isTargetHeading = normalizedHeadings.some(
//             (heading) =>
//                 lowerLine === heading ||
//                 headingWithoutNumber === heading ||
//                 lowerLine.startsWith(`${heading}:`) ||
//                 headingWithoutNumber.startsWith(`${heading}:`) ||
//                 lowerLine.startsWith(`${heading} -`) ||
//                 headingWithoutNumber.startsWith(`${heading} -`)
//         );

//         if (isTargetHeading) {
//             collecting = true;

//             const colonIndex = line.indexOf(":");

//             if (colonIndex !== -1) {
//                 const valueAfterColon = cleanValue(
//                     line.substring(colonIndex + 1)
//                 );

//                 if (valueAfterColon) {
//                     section.push(valueAfterColon);
//                 }
//             }

//             continue;
//         }

//         if (!collecting) {
//             continue;
//         }

//         const looksLikeHeading =
//             /^[A-Z][A-Z\s/&().,'-]{4,}$/.test(line) ||
//             /^(section|chapter|part)\s+[0-9ivx]+/i.test(line) ||
//             /^\d+\.\s+[A-Z]/.test(line);

//         if (looksLikeHeading) {
//             break;
//         }

//         section.push(line);
//     }

//     return cleanValue(section.join(" "));
// };

// const extractEmail = (text) => {
//     const matches = text.match(
//         /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
//     );

//     if (!matches || matches.length === 0) {
//         return "";
//     }

//     return matches[0];
// };

// const extractWebsite = (text) => {
//     const match = text.match(
//         /https?:\/\/[^\s]+|www\.[^\s]+/i
//     );

//     if (!match) {
//         return "";
//     }

//     return match[0].replace(/[),.;]+$/, "");
// };

// const extractDates = (text) => {
//     const closingDate = extractLabelValue(text, [
//         "Bid End Date/Time",
//         "Bid End Date",
//         "Tender Closing Date",
//         "Closing Date",
//         "Bid Closing Date"
//     ]);

//     const openingDate = extractLabelValue(text, [
//         "Bid Opening Date/Time",
//         "Bid Opening Date",
//         "Tender Opening Date",
//         "Opening Date",
//         "Bid Opening"
//     ]);

//     return {
//         openingDate,
//         closingDate
//     };
// };

// const extractTechnicalQualification = (text) => {
//     const sections = [];

//     const eligibilityLines = [];
//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     let collectingEligibility = false;

//     for (const line of lines) {
//         const lowerLine = line.toLowerCase();

//         if (
//             lowerLine.includes("eligibility criteria") ||
//             lowerLine.includes("technical qualification")
//         ) {
//             collectingEligibility = true;
//             continue;
//         }

//         if (!collectingEligibility) {
//             continue;
//         }

//         if (
//             lowerLine.includes("requirement description") ||
//             lowerLine.includes("special terms & conditions") ||
//             lowerLine.includes("delivery requirement") ||
//             lowerLine.includes("guarantee clause")
//         ) {
//             break;
//         }

//         eligibilityLines.push(line);
//     }

//     if (eligibilityLines.length > 0) {
//         sections.push(eligibilityLines.join(" "));
//     }

//     const experience = extractSection(text, [
//         "Experience Criteria",
//         "Past Project Experience"
//     ]);

//     const manufacturerAuthorization = extractSection(text, [
//         "Manufacturer Authorization",
//         "OEM Authorization"
//     ]);

//     const technicalRequirements = extractSection(text, [
//         "Technical Qualification",
//         "Technical Eligibility",
//         "Technical Criteria",
//         "Technical Qualification Criteria",
//         "Technical Requirements",
//         "Technical Specifications"
//     ]);

//     if (experience) {
//         sections.push(experience);
//     }

//     if (manufacturerAuthorization) {
//         sections.push(manufacturerAuthorization);
//     }

//     if (technicalRequirements) {
//         sections.push(technicalRequirements);
//     }

//     return cleanValue(sections.join(" "));
// };

// const extractFinancialQualification = (text) => {
//     const sections = [];

//     const explicitFinancial = extractSection(text, [
//         "Financial Qualification",
//         "Financial Eligibility",
//         "Financial Criteria",
//         "Financial Qualification Criteria",
//         "Financial Requirements",
//         "Bidder financial standing",
//         "Financial Standing"
//     ]);

//     if (explicitFinancial) {
//         sections.push(explicitFinancial);
//     }

//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     const financialLines = [];

//     for (let i = 0; i < lines.length; i++) {
//         const lowerLine = lines[i].toLowerCase();

//         if (
//             lowerLine.includes("financial standing") ||
//             lowerLine.includes("financial qualification") ||
//             lowerLine.includes("financial eligibility")
//         ) {
//             financialLines.push(lines[i]);

//             if (lines[i + 1]) {
//                 financialLines.push(lines[i + 1]);
//             }

//             if (lines[i + 2]) {
//                 financialLines.push(lines[i + 2]);
//             }
//         }
//     }

//     if (financialLines.length > 0) {
//         sections.push(financialLines.join(" "));
//     }

//     return cleanValue(sections.join(" "));
// };

// const extractScope = (text) => {
//     const directScope = extractSection(text, [
//         "Scope of Work",
//         "Scope Of Work",
//         "Scope of Supply",
//         "Scope Of Supply",
//         "Work Scope"
//     ]);

//     if (directScope) {
//         return directScope;
//     }

//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     for (const line of lines) {
//         if (
//             line.toLowerCase().includes("scope of supply")
//         ) {
//             const colonIndex = line.indexOf(":");

//             if (colonIndex !== -1) {
//                 return cleanValue(
//                     line.substring(colonIndex + 1)
//                 );
//             }
//         }
//     }

//     return "";
// };

// const extractPurchaserAddress = (text) => {
//     const lines = text
//         .split("\n")
//         .map((line) => cleanValue(line))
//         .filter(Boolean);

//     let collecting = false;
//     const addressLines = [];

//     for (const line of lines) {
//         const lowerLine = line.toLowerCase();

//         if (
//             lowerLine.includes("consignees/reporting officer") ||
//             lowerLine === "consignees"
//         ) {
//             collecting = true;
//             continue;
//         }

//         if (!collecting) {
//             continue;
//         }

//         if (
//             lowerLine.includes("buyer added bid specific") ||
//             lowerLine.includes("technical specifications")
//         ) {
//             break;
//         }

//         if (/^\d+\s+/.test(line)) {
//             addressLines.push(line);
//             continue;
//         }

//         if (addressLines.length > 0) {
//             addressLines.push(line);
//         }

//         if (addressLines.length >= 5) {
//             break;
//         }
//     }

//     const address = addressLines
//         .join(" ")
//         .replace(/^\d+\s+/, "")
//         .replace(/\s+\d+\s+\d+$/, "")
//         .trim();

//     if (address) {
//         return cleanValue(address);
//     }

//     return extractLabelValue(text, [
//         "Purchaser Address",
//         "Purchaser's Address",
//         "Buyer Address",
//         "Buyer's Address",
//         "Address of Purchaser"
//     ]);
// };

// const extractLocation = (text) => {
//     const explicitLocation = extractLabelValue(text, [
//         "Location",
//         "Work Location",
//         "Place of Work",
//         "Site Location",
//         "Delivery Location",
//         "Consignee Location"
//     ]);

//     if (explicitLocation) {
//         return explicitLocation;
//     }

//     const office = extractLabelValue(text, [
//         "Office Name"
//     ]);

//     if (office) {
//         return office;
//     }

//     return "";
// };

// const DEFAULT_TRITORC_KEYWORDS = [
//     "hydraulic torque wrench",
//     "torque wrench",
//     "bolt tensioner",
//     "hydraulic tensioner",
//     "hydraulic bolt tensioning",
//     "bolting tool",
//     "bolting tools",
//     "controlled bolting",
//     "flange management",
//     "flange maintenance",
//     "flange joint integrity",
//     "on-site machining",
//     "onsite machining",
//     "pipe cutting",
//     "pipe beveling",
//     "bolt torquing",
//     "hydraulic pump",
//     "nut splitter",
//     "hydraulic wrench",
//     "torqueing",
//     "flange facing",
//     "cold cutting",
//     "line boring",
//     "valve grinding",
//     "hot bolting",
//     "leak sealing",
//     "torque calibration",
//     "mechanical bolting",
//     "bolted joint",
//     "pre-tensioning"
// ];

// const extractKeywordMatches = (
//     text,
//     keywords
// ) => {
//     const lowerText = text.toLowerCase();

//     const matched = [];

//     const sortedKeywords = [...keywords].sort(
//         (a, b) => b.length - a.length
//     );

//     for (const keyword of sortedKeywords) {
//         const escaped = escapeRegex(
//             keyword.toLowerCase()
//         );

//         const regex = new RegExp(
//             `\\b${escaped}\\b`,
//             "i"
//         );

//         if (!regex.test(lowerText)) {
//             continue;
//         }

//         const isContainedInExistingMatch =
//             matched.some((existing) => {
//                 return existing
//                     .toLowerCase()
//                     .includes(keyword.toLowerCase());
//             });

//         if (!isContainedInExistingMatch) {
//             matched.push(keyword);
//         }
//     }

//     return matched;
// };

// const computeRelevance = (matchCount) => {
//     if (matchCount >= 3) {
//         return "Related";
//     }

//     if (matchCount >= 1) {
//         return "Possibly Related";
//     }

//     return "Not Related";
// };

// export const extractTenderData = (
//     rawText,
//     documentName = "",
//     keywords = DEFAULT_TRITORC_KEYWORDS
// ) => {
//     const text = normalizeText(rawText);

//     const {
//         openingDate,
//         closingDate
//     } = extractDates(text);

//     const tenderId = extractLabelValue(text, [
//         "Bid Number",
//         "Tender ID",
//         "Tender Id",
//         "Bid No"
//     ]);

//     const tenderNo = extractLabelValue(text, [
//         "Tender No.",
//         "Tender No",
//         "Tender Ref No",
//         "Reference Number",
//         "Reference No"
//     ]);

//     const tenderAuthority =
//         extractLabelValue(text, [
//             "Department Name",
//             "Tender Authority",
//             "Authority"
//         ]);

//     const location = extractLocation(text);

//     const tenderAmount = extractLabelValue(text, [
//         "Tender Amount",
//         "Estimated Tender Value",
//         "Estimated Bid Value",
//         "Estimated Value",
//         "Tender Value",
//         "Bid Value",
//         "Total Tender Value"
//     ]);

//     let emd = extractLabelValue(text, [
//         "EMD Amount",
//         "EMD",
//         "Earnest Money Deposit",
//         "Earnest Money"
//     ]);

//     if (!emd) {
//         const lines = text
//             .split("\n")
//             .map((line) => cleanValue(line))
//             .filter(Boolean);

//         for (let i = 0; i < lines.length; i++) {
//             if (
//                 lines[i]
//                     .toLowerCase()
//                     .includes("emd detail")
//             ) {
//                 // The requirement flag and its Yes/No answer are very
//                 // often on the SAME next line, e.g. "आवPयकता/Required No".
//                 // Check for that first before assuming the answer lives
//                 // two lines down.
//                 const detailLine = lines[i + 1] || "";
//                 const inlineMatch = detailLine.match(
//                     /required\s*[:\-]?\s*(.+)$/i
//                 );

//                 if (inlineMatch && inlineMatch[1]) {
//                     emd = cleanValue(inlineMatch[1]);
//                 } else if (
//                     detailLine.toLowerCase().includes("required")
//                 ) {
//                     // "Required" with nothing else on the line -> the
//                     // actual answer really is on the line after that.
//                     emd = lines[i + 2] || "";
//                 } else {
//                     emd = detailLine;
//                 }

//                 break;
//             }
//         }
//     }

//     const documentCost = extractLabelValue(text, [
//         "Document Cost",
//         "Cost of Tender Document",
//         "Tender Document Cost",
//         "Tender Document Fee"
//     ]);

//     const tenderFee = extractLabelValue(text, [
//         "Tender Fee",
//         "Tender Fees",
//         "Bid Fee",
//         "Bid Participation Fee"
//     ]);

//     const tabName = extractLabelValue(text, [
//         "Item Category",
//         "Product Category",
//         "Primary product category",
//         "Category"
//     ]);

//     const technicalQualification =
//         extractTechnicalQualification(text);

//     const financialQualification =
//         extractFinancialQualification(text);

//     const scopeOfWork =
//         extractScope(text);

//     const tenderSummary =
//         extractSection(text, [
//             "Tender Summary",
//             "Tender Summary / Description",
//             "Bid Summary",
//             "Summary"
//         ]);

//     const tenderDescription =
//         extractSection(text, [
//             "Tender Description",
//             "Bid Description",
//             "Description"
//         ]);

//     const corrigendum =
//         extractSection(text, [
//             "Corrigendum",
//             "Corrigenda",
//             "Amendment",
//             "Amendments",
//             "Addendum",
//             "Addenda"
//         ]);

//     const purchaserAddress =
//         extractPurchaserAddress(text);

//     const email = extractEmail(text);

//     const website = extractWebsite(text);

//     const searchableText = [
//         text,
//         scopeOfWork,
//         tenderSummary,
//         tenderDescription,
//         technicalQualification
//     ].join(" ");

//     const matchedKeywords =
//         extractKeywordMatches(
//             searchableText,
//             keywords
//         );

//     const matchCount =
//         matchedKeywords.length;

//     const relevance =
//         computeRelevance(matchCount);

//     return {
//         documentName,

//         tenderId,
//         tenderNo,
//         tenderAuthority,
//         location,

//         openingDate,
//         closingDate,

//         tenderAmount,
//         emd,
//         documentCost,
//         tenderFee,

//         tabName,

//         technicalQualification,
//         financialQualification,

//         scopeOfWork,
//         tenderSummary,
//         tenderDescription,
//         corrigendum,

//         purchaserAddress,

//         email,
//         website,

//         matchedKeywords,
//         matchCount,
//         score: matchCount,
//         relevance
//     };
// };

// export {
//     DEFAULT_TRITORC_KEYWORDS,
//     extractKeywordMatches,
//     computeRelevance
// };
const cleanValue = (value = "") => {
    return value
        .replace(/\s+/g, " ")
        .replace(/^[\s:|-]+|[\s:|-]+$/g, "")
        .trim();
};

const normalizeText = (text = "") => {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


/*
    Extract a value from a label that may appear:
    
    Hindi Label / English Label: Value

    Example:
    बड सं?या/Bid Number: GEM/2026/B/7824594

    Also handles:

    बड बंद होने क तारख/समय /Bid End Date/Time
    03-08-2026 09:00:00
*/
const extractLabelValue = (text, labels) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    for (const label of labels) {
        const escapedLabel = escapeRegex(label);

        // Label + value on same line
        const sameLineRegex = new RegExp(
            `(?:^|\\s)${escapedLabel}\\s*[:\\-]?\\s*(.+)$`,
            "i"
        );

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(sameLineRegex);

            if (match && match[1]) {
                const value = cleanValue(match[1]);

                if (
                    value &&
                    value.toLowerCase() !== label.toLowerCase() &&
                    value.length >= 2 &&
                    /[A-Za-z0-9]/.test(value)
                ) {
                    return value;
                }
            }
        }

        // Label on one line, value on following line
        const labelOnlyRegex = new RegExp(
            `${escapedLabel}\\s*$`,
            "i"
        );

        for (let i = 0; i < lines.length; i++) {
            if (!labelOnlyRegex.test(lines[i])) {
                continue;
            }

            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const candidate = cleanValue(lines[j]);

                if (!candidate) {
                    continue;
                }

                // Skip fragments such as Date/Time
                if (
                    /^(date|time|date\/time|no|no\.|detail|details)$/i.test(
                        candidate
                    )
                ) {
                    continue;
                }

                if (
                    candidate.length >= 2 &&
                    /[A-Za-z0-9]/.test(candidate)
                ) {
                    return candidate;
                }
            }
        }
    }

    return "";
};


/*
    GeM dates are usually:

    Bid End Date/Time 03-08-2026 09:00:00
    Bid Opening Date/Time 03-08-2026 09:30:00
*/
const extractDates = (text) => {
    const closingDate = extractLabelValue(text, [
        "Bid End Date/Time",
        "Bid End Date"
    ]);

    const openingDate = extractLabelValue(text, [
        "Bid Opening Date/Time",
        "Bid Opening Date"
    ]);

    return {
        openingDate,
        closingDate
    };
};


/*
    GeM EMD is slightly different.

    Typical structure:

    EMD Detail
    Required No

    So we explicitly look for the EMD section instead of
    searching the entire document for "EMD".
*/
const extractEMD = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        if (!line.includes("emd detail")) {
            continue;
        }

        // Example:
        // Required No
        const nextLine = lines[i + 1] || "";

        const requiredMatch = nextLine.match(
            /required\s*[:\-]?\s*(yes|no|₹?\s*[\d,]+)/i
        );

        if (requiredMatch) {
            return cleanValue(requiredMatch[1]);
        }

        if (/required\s+(yes|no)$/i.test(nextLine)) {
            return cleanValue(
                nextLine.replace(/^required\s+/i, "")
            );
        }

        // If Required is alone on its own line
        if (/^required$/i.test(nextLine)) {
            const answer = lines[i + 2] || "";

            if (
                /^(yes|no)$/i.test(answer) ||
                /₹?\s*[\d,]+/.test(answer)
            ) {
                return cleanValue(answer);
            }
        }
    }

    return "";
};


/*
    Technical qualification / eligibility.
*/
const extractTechnicalQualification = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    const collected = [];

    let collecting = false;

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (
            lower.includes("eligibility criteria") ||
            lower.includes("technical qualification")
        ) {
            collecting = true;
            continue;
        }

        if (!collecting) {
            continue;
        }

        if (
            lower.includes("special terms & conditions") ||
            lower.includes("special terms and conditions") ||
            lower.includes("delivery requirement") ||
            lower.includes("guarantee clause") ||
            lower.includes("scope of supply")
        ) {
            break;
        }

        collected.push(line);
    }

    return cleanValue(collected.join(" "));
};


/*
    Financial qualification.

    If the document doesn't contain a financial qualification
    section, leave it blank rather than inventing data.
*/
const extractFinancialQualification = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    const collected = [];

    let collecting = false;

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (
            lower.includes("financial qualification") ||
            lower.includes("financial eligibility") ||
            lower.includes("financial criteria") ||
            lower.includes("financial standing")
        ) {
            collecting = true;
            collected.push(line);
            continue;
        }

        if (!collecting) {
            continue;
        }

        if (
            lower.includes("technical") ||
            lower.includes("scope of supply") ||
            lower.includes("special terms")
        ) {
            break;
        }

        collected.push(line);
    }

    return cleanValue(collected.join(" "));
};


/*
    Scope of Work / Scope of Supply.
*/
const extractScopeOfWork = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    for (const line of lines) {
        const match = line.match(
            /scope\s+of\s+(?:work|supply)\s*[:\-]?\s*(.+)$/i
        );

        if (match && match[1]) {
            return cleanValue(match[1]);
        }
    }

    return "";
};


/*
    GeM purchaser address.

    The sample document contains the address in the
    Consignees/Reporting Officer section.
*/
const extractPurchaserAddress = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    let collecting = false;
    const addressLines = [];

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (
            lower.includes("consignees/reporting officer") ||
            lower === "consignees"
        ) {
            collecting = true;
            continue;
        }

        if (!collecting) {
            continue;
        }

        if (
            lower.includes("buyer added bid specific") ||
            lower.includes("technical specifications") ||
            lower.includes("special terms")
        ) {
            break;
        }

        /*
            Address in the GeM PDF starts with the PIN code.
            Example:
            769011, Office of GM I/c Stores & Inspection,
            Rourkela Steel Plant, Rourkela
        */
        if (/^\d{6}[,\s]/.test(line)) {
            addressLines.push(line);
            continue;
        }

        if (addressLines.length > 0) {
            addressLines.push(line);
        }

        if (addressLines.length >= 4) {
            break;
        }
    }

    if (addressLines.length > 0) {
        return cleanValue(
            addressLines
                .join(" ")
                .replace(/\s+\d+\s+\d+$/, "")
        );
    }

    return "";
};


/*
    Location.

    Do NOT use generic "Location" first because GeM documents
    contain many unrelated occurrences of the word.

    We first try explicit delivery/site location.
    Then use the city/place from the purchaser address.
*/
const extractLocation = (text, purchaserAddress) => {
    const explicitLocation = extractLabelValue(text, [
        "Work Location",
        "Place of Work",
        "Site Location",
        "Delivery Location",
        "Consignee Location"
    ]);

    if (explicitLocation) {
        return explicitLocation;
    }

    /*
        Example purchaser address:
        769011, Office of GM I/c Stores & Inspection,
        Rourkela Steel Plant, Rourkela
    */

    if (purchaserAddress) {
        const parts = purchaserAddress
            .split(",")
            .map((part) => cleanValue(part))
            .filter(Boolean);

        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
    }

    return "";
};


/*
    Buyer email is preferable to simply taking the first email
    in the document.
*/
const extractEmail = (text) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    for (const line of lines) {
        if (line.toLowerCase().includes("buyer email")) {
            const match = line.match(
                /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
            );

            if (match) {
                return match[0];
            }
        }
    }

    const matches = text.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    );

    return matches?.[0] || "";
};


const extractWebsite = (text) => {
    const match = text.match(
        /https?:\/\/[^\s]+|www\.[^\s]+/i
    );

    if (!match) {
        return "";
    }

    return match[0].replace(/[),.;]+$/, "");
};


/*
    Simple section extractor.
*/
const extractSection = (text, headings) => {
    const lines = text
        .split("\n")
        .map((line) => cleanValue(line))
        .filter(Boolean);

    const normalizedHeadings = headings.map((heading) =>
        heading.toLowerCase()
    );

    let collecting = false;
    const section = [];

    for (const line of lines) {
        const lower = line.toLowerCase();

        const isHeading = normalizedHeadings.some(
            (heading) =>
                lower === heading ||
                lower.startsWith(`${heading}:`) ||
                lower.startsWith(`${heading} -`)
        );

        if (isHeading) {
            collecting = true;

            const colonIndex = line.indexOf(":");

            if (colonIndex !== -1) {
                const value = cleanValue(
                    line.substring(colonIndex + 1)
                );

                if (value) {
                    section.push(value);
                }
            }

            continue;
        }

        if (!collecting) {
            continue;
        }

        /*
            Stop at obvious next sections.
        */
        if (
            /^(special terms|delivery|eligibility criteria|technical specifications|scope of supply|buyer added)/i.test(
                lower
            )
        ) {
            break;
        }

        section.push(line);
    }

    return cleanValue(section.join(" "));
};


/*
    Tritorc keywords.

    Longer phrases are checked first so:
        hydraulic torque wrench

    is preferred over:
        torque wrench
*/
const DEFAULT_TRITORC_KEYWORDS = [
    "hydraulic torque wrench",
    "hydraulic tensioner",
    "hydraulic bolt tensioning",
    "flange joint integrity",
    "on-site machining",
    "onsite machining",
    "torque calibration",
    "controlled bolting",
    "mechanical bolting",
    "pre-tensioning",
    "bolt tensioner",
    "bolting tool",
    "bolting tools",
    "flange management",
    "flange maintenance",
    "pipe cutting",
    "pipe beveling",
    "bolt torquing",
    "hydraulic pump",
    "nut splitter",
    "hydraulic wrench",
    "torque wrench",
    "torqueing",
    "flange facing",
    "cold cutting",
    "line boring",
    "valve grinding",
    "hot bolting",
    "leak sealing",
    "bolted joint"
];


const extractKeywordMatches = (
    text,
    keywords = DEFAULT_TRITORC_KEYWORDS
) => {
    const lowerText = text.toLowerCase();

    const sortedKeywords = [...keywords].sort(
        (a, b) => b.length - a.length
    );

    const matched = [];

    for (const keyword of sortedKeywords) {
        const escaped = escapeRegex(
            keyword.toLowerCase()
        );

        const regex = new RegExp(
            `\\b${escaped}\\b`,
            "i"
        );

        if (!regex.test(lowerText)) {
            continue;
        }

        /*
            Don't count:
                torque wrench

            separately when:
                hydraulic torque wrench

            has already matched.
        */
        const alreadyCovered = matched.some(
            (existing) =>
                existing
                    .toLowerCase()
                    .includes(keyword.toLowerCase())
        );

        if (!alreadyCovered) {
            matched.push(keyword);
        }
    }

    return matched;
};


const computeRelevance = (matchCount) => {
    if (matchCount >= 3) {
        return "Related";
    }

    if (matchCount >= 1) {
        return "Possibly Related";
    }

    return "Not Related";
};


export const extractTenderData = (
    rawText,
    documentName = "",
    keywords = DEFAULT_TRITORC_KEYWORDS
) => {
    const text = normalizeText(rawText);

    /*
        -------------------------
        BASIC TENDER INFORMATION
        -------------------------
    */

    const tenderId = extractLabelValue(text, [
        "Bid Number",
        "Tender ID",
        "Tender Id",
        "Bid No"
    ]);

    /*
        Tender No is separate from Bid Number.
        If the document doesn't have it, leave it blank.
    */
    const tenderNo = extractLabelValue(text, [
        "Tender No.",
        "Tender No",
        "Tender Ref No",
        "Reference Number",
        "Reference No"
    ]);

    /*
        GeM:
        Department Name = Steel Authority of India Limited

        We deliberately don't use generic "Authority".
    */
    const tenderAuthority = extractLabelValue(text, [
        "Department Name",
        "Tender Authority"
    ]);

    const openingDate = extractLabelValue(text, [
        "Bid Opening Date/Time",
        "Bid Opening Date"
    ]);

    const closingDate = extractLabelValue(text, [
        "Bid End Date/Time",
        "Bid End Date"
    ]);

    /*
        -------------------------
        FINANCIAL INFORMATION
        -------------------------
    */

    const tenderAmount = extractLabelValue(text, [
        "Tender Amount",
        "Estimated Tender Value",
        "Estimated Bid Value",
        "Estimated Value",
        "Tender Value",
        "Bid Value",
        "Total Tender Value"
    ]);

    const emd = extractEMD(text);

    const documentCost = extractLabelValue(text, [
        "Document Cost",
        "Cost of Tender Document",
        "Tender Document Cost"
    ]);

    const tenderFee = extractLabelValue(text, [
        "Tender Fee",
        "Tender Fees",
        "Bid Fee",
        "Bid Participation Fee"
    ]);

    /*
        -------------------------
        CATEGORY / DESCRIPTION
        -------------------------
    */

    const tabName = extractLabelValue(text, [
        "Item Category",
        "Product Category",
        "Primary product category"
    ]);

    const tenderDescription =
        extractLabelValue(text, [
            "Requirement Description"
        ]) ||
        tabName;

    /*
        -------------------------
        QUALIFICATION
        -------------------------
    */

    const technicalQualification =
        extractTechnicalQualification(text);

    const financialQualification =
        extractFinancialQualification(text);

    /*
        -------------------------
        SCOPE
        -------------------------
    */

    const scopeOfWork =
        extractScopeOfWork(text);

    /*
        -------------------------
        SUMMARY / CORRIGENDUM
        -------------------------
    */

    const tenderSummary =
        extractSection(text, [
            "Tender Summary",
            "Tender Summary / Description",
            "Bid Summary"
        ]);

    const corrigendum =
        extractSection(text, [
            "Corrigendum",
            "Corrigenda",
            "Amendment",
            "Amendments",
            "Addendum",
            "Addenda"
        ]);

    /*
        -------------------------
        PURCHASER / CONTACT
        -------------------------
    */

    const purchaserAddress =
        extractPurchaserAddress(text);

    const location =
        extractLocation(
            text,
            purchaserAddress
        );

    const email =
        extractEmail(text);

    const website =
        extractWebsite(text);

    /*
        -------------------------
        KEYWORD MATCHING
        -------------------------
    */

    const searchableText = [
        text,
        scopeOfWork,
        tenderDescription,
        tenderSummary,
        technicalQualification
    ].join(" ");

    const matchedKeywords =
        extractKeywordMatches(
            searchableText,
            keywords
        );

    const matchCount =
        matchedKeywords.length;

    const relevance =
        computeRelevance(matchCount);

    /*
        -------------------------
        FINAL RESULT
        -------------------------
    */

    return {
        documentName,

        tenderId,
        tenderNo,
        tenderAuthority,
        location,

        openingDate,
        closingDate,

        tenderAmount,
        emd,
        documentCost,
        tenderFee,

        tabName,

        technicalQualification,
        financialQualification,

        scopeOfWork,
        tenderSummary,
        tenderDescription,
        corrigendum,

        purchaserAddress,

        email,
        website,

        matchedKeywords,
        matchCount,

        score: matchCount,

        relevance
    };
};


export {
    DEFAULT_TRITORC_KEYWORDS,
    extractKeywordMatches,
    computeRelevance
};