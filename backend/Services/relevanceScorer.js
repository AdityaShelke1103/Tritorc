export const calculateRelevance = (matchCount) => {
    if (matchCount >= 3) {
        return "Related";
    }

    else if (matchCount >= 1) {
        return "Possibly Related";
    }

    else return "Not Related";
};