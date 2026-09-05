const keywordConfig = [
    {
        name: "Hydraulic torque wrench",
        variants: [
            "hydraulic torque wrench",
            "hydraulic torque wrenches"
        ]
    },

    {
        name: "Bolt tensioner",
        variants: [
            "bolt tensioner",
            "bolt tensioners"
        ]
    },

    {
        name: "Hydraulic bolt tensioning",
        variants: [
            "hydraulic bolt tensioning"
        ]
    },

    {
        name: "Controlled bolting",
        variants: [
            "controlled bolting"
        ]
    },

    {
        name: "Flange management",
        variants: [
            "flange management"
        ]
    },

    {
        name: "Flange joint integrity",
        variants: [
            "flange joint integrity"
        ]
    },

    {
        name: "Torque wrench",
        variants: [
            "torque wrench",
            "torque wrenches"
        ]
    },

    {
        name: "Stud bolt tensioning",
        variants: [
            "stud bolt tensioning"
        ]
    },

    {
        name: "Nut splitter",
        variants: [
            "nut splitter",
            "nut splitters"
        ]
    },

    {
        name: "Torque multiplier",
        variants: [
            "torque multiplier",
            "torque multipliers"
        ]
    },

    {
        name: "Bolting tools",
        variants: [
            "bolting tool",
            "bolting tools"
        ]
    },

    {
        name: "Flange bolt tightening",
        variants: [
            "flange bolt tightening"
        ]
    },

    {
        name: "Turnaround services",
        variants: [
            "turnaround service",
            "turnaround services"
        ]
    },

    {
        name: "Shutdown maintenance",
        variants: [
            "shutdown maintenance"
        ]
    },

    {
        name: "Plant shutdown",
        variants: [
            "plant shutdown",
            "plant shutdowns"
        ]
    },

    {
        name: "Bolted joint",
        variants: [
            "bolted joint",
            "bolted joints"
        ]
    },

    {
        name: "Pre-tensioning",
        variants: [
            "pre-tensioning",
            "pretensioning"
        ]
    },

    {
        name: "Gasket and flange management",
        variants: [
            "gasket and flange management"
        ]
    },

    {
        name: "Torque calibration",
        variants: [
            "torque calibration"
        ]
    },

    {
        name: "Mechanical bolting",
        variants: [
            "mechanical bolting"
        ]
    }
];

export const matchKeywords = (text) => {
    const normalizedText = text
        .toLowerCase()
        .replace(/\s+/g, " ");

    const matchedKeywords = [];

    for (const keyword of keywordConfig) {
        const matched = keyword.variants.some((variant) =>
            normalizedText.includes(variant.toLowerCase())
        );

        if (matched) {
            matchedKeywords.push(keyword.name);
        }
    }

    return {
        matchedKeywords,
        matchCount: matchedKeywords.length,
        score: matchedKeywords.length
    };
};