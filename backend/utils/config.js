import dotenv from "dotenv";
dotenv.config();

const booleanVars = [
    "IS_STAGING",
    "IS_PRODUCTION",
    "IS_UAT",
    "IS_ANALYST_MARKET",
    "IS_IGNORE_SPECIAL",
    "IS_ELIGIBLE_ENTRY",
    "IS_FORCE_OUT",
    "IS_ELIGIBLE_STRATEGY",
    "IS_CUT_LOSS",
    "IS_LINEAR",
    "IS_RESET",
    "IS_PAST_MONTHS",
    "IS_COMPOUNDING",
    "IS_MAINTENANCE",
    "IS_DRAW_CHART",
    "IS_ANALYST_HISTORY",
    "IS_ANALYST_INVEST",
    "IS_ANALYST_PNL",
    "IS_ANALYST_LOG",
    "IS_FINAL",
    "IS_WINDOWS_SERVER",
    "IS_TRADE_IN_FUTURE",
    "IS_ELIGIBLE_BY_BTC",
];

const arrayVars = ["IGNORE_SYMBOLS", "SPECIAL_SYMBOLS", "SPOT_SYMBOLS", "FUTU_SYMBOLS", "EMAIL_RECEIVER"];

const numericVars = [
    "PROFIT_PERCENT",
    "CUT_LOSS_PERCENT",
    "TOTAL_DCA",
    "DCA_PERCENT",
    "MAX_LINEAR_PERCENT",
    "FUNDING_PERCENT",
    "TOTAL_PAST_MONTHS",
    "COMPOUNDING",
    "INVEST",
    "USDT_FREE",
    "FUTU_INVEST",
    "FUTU_LEVERAGE",
];

const defaultValues = {
    SPOT_TIME_FRAME: "15m",
    SIGNAL_TIME_FRAME: "1d",
    FUTU_TIME_FRAME: "1d",
    ELIGIBLE_TIME_FRAME: "1d",
    INVEST: 7,
    FUNDING_PERCENT: -0.001,
};

const config = new Proxy(process.env, {
    get: (target, prop) => {
        if (prop in defaultValues && !target[prop]) {
            return defaultValues[prop];
        }
        if (booleanVars.includes(prop)) {
            return target[prop] === "TRUE";
        }
        if (arrayVars.includes(prop)) {
            return target[prop] ? target[prop].split(",") : [];
        }
        if (numericVars.includes(prop)) {
            return target[prop] ? parseFloat(target[prop]) : null;
        }
        return target[prop];
    },
    set: (target, prop, value) => {
        if (booleanVars.includes(prop)) {
            target[prop] = value ? "TRUE" : "FALSE";
        } else if (arrayVars.includes(prop)) {
            target[prop] = Array.isArray(value) ? value.join(",") : value;
        } else if (numericVars.includes(prop)) {
            target[prop] = value.toString();
        } else {
            target[prop] = value;
        }
        return true;
    },
});

export default config;
