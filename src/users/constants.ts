const BASE_TAP_COST = 50;
const TAP_COST_MULTIPLIER = 1.4;

const BASE_CRIT_COST = 150;
const CRIT_COST_MULTIPLIER = 1.8;

export const calculateUpgradeCost = (currentLevel: number, type: 'tap' | 'crit') => {
    if (type === 'tap') {
        return Math.floor(BASE_TAP_COST * Math.pow(TAP_COST_MULTIPLIER, currentLevel - 1));
    } else {
        return Math.floor(BASE_CRIT_COST * Math.pow(CRIT_COST_MULTIPLIER, currentLevel - 1));
    }
}

export const calculateTapValue = (level: number) => {
    
    return Math.floor(1 + (level * 1.1)); 
}

export const calculateCritValue = (level: number) => {
    const baseCrit = 1;
    const bonusPerLevel = 2;
    return baseCrit + ((level - 1) * bonusPerLevel);
}