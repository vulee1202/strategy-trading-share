import { performance } from "perf_hooks";
import cron from "node-cron";
import container from "./startup.js";
import createHistory from "./strategy/analyst/history.js";
import createMarket from "./strategy/analyst/market.js";
import createTest from "./strategy/testStrategy.js";
import createAnalyst from "./strategy/analyst.js";
import createEligible from "./strategy/eligible.js";
import createTrader from "./strategy/trader.js";
import createSignal from "./strategy/signal.js";

class App {
    #market;
    #logger;
    #config;
    #signal;
    #analyst;
    #test;
    #trader;
    #expressApp;
    #sse; // Add SSE instance

    constructor(container, signal, analyst, test, trader) {
        this.#logger = container.get("logger");
        this.#config = container.get("config");
        this.#market = container.get("market");
        this.#expressApp = container.get("expressApp");
        this.#sse = container.get("sse");
        this.#signal = signal;
        this.#analyst = analyst;
        this.#test = test;
        this.#trader = trader;
        this.initializeExpressApp();
    }

    initializeExpressApp = () => {
        if (this.#config.IS_STAGING || this.#config.IS_PRODUCTION) {
            const port = this.#config.PORT;
            this.#expressApp.listen(port, "0.0.0.0", () => {
                this.#logger.info(`SSE server started on port ${port}`);
            });

            this.#expressApp.get("/sse", (req, res) => this.#sse.handle(req, res));
        }
    };

    startTest = async () => {
        const now = new Date();
        const timeframe = this.#config.SPOT_TIME_FRAME;

        const timeframeMultipliers = {
            "1d": 24 * 4,
            "4h": 8 * 4,
            "1h": 1 * 4,
        };

        const multiplier = timeframeMultipliers[timeframe] ?? 1;
        const backStart = -35 * multiplier;
        const nextEnd = -1 * multiplier;

        const symbols = await this.#market.fetchSymbol(false);
        // const symbols = ["BANANA/USDT", "TON/USDT"];

        const { START_DATE, END_DATE } = this.#config;
        let startDate = new Date(START_DATE);
        let endDate = new Date(END_DATE);
        endDate = endDate > now ? now : endDate;

        await this.#test.testStrategy(symbols, startDate.setMinutes(backStart), endDate.setMinutes(nextEnd));
    };

    analyzeMarket = async () => {
        const symbols = await this.#market.fetchSymbol(false);
        const timeline = new Date();
        await this.#analyst.analyze("market", symbols, timeline);
    };

    analyzeHistory = async () => {
        await this.#analyst.analyze("historical");
    };

    startSignalLnS = async () => {
        const symbols = await this.#market.fetchSymbol(true);
        await this.#signal.longNshort(symbols);
    };

    tradeMarket = async () => {
        const symbols = this.#config.IS_STAGING
            ? await this.#market.fetchSymbol(false)
            : //   ?["SAGA/USDT"]
            this.#config.IS_PRODUCTION
            ? await this.#market.fetchSymbol(false)
            : [];

        await this.#trader.spot(symbols);
    };

    tradeFuture = async () => {
        if (!this.#config.IS_TRADE_IN_FUTURE) return;
        const symbols = this.#config.IS_STAGING
            ? await this.#market.fetchSymbol(true)
            : this.#config.IS_PRODUCTION
            ? await this.#market.fetchSymbol(true)
            : [];

        await this.#trader.future(symbols);
    };

    runTask = async (taskName, task) => {
        const start = performance.now();
        try {
            await task();
            const end = performance.now();
            const durationInSeconds = ((end - start) / 1000).toFixed(4);
            this.#logger.info(`[${taskName}] completed in ${durationInSeconds} seconds`);
        } catch (error) {
            this.#logger.error(`Error in ${taskName}:`, error);
        }
    };
}

const runApps = async (container) => {
    const config = container.get("config");
    const {
        IS_PRODUCTION,
        IS_STAGING,
        IS_UAT,
        IS_ANALYST_MARKET,
        IS_ANALYST_HISTORY,
        ENTRY_RECIPE,
        OUTRY_RECIPE,
        PORT,
    } = config;

    if (IS_PRODUCTION || IS_STAGING) {
        const recipes = [{ e: ENTRY_RECIPE, o: OUTRY_RECIPE, port: PORT || 3379 }];

        const tasks = recipes
            .map(async (recipe) => {
                config.ENTRY_RECIPE = recipe.e;
                config.OUTRY_RECIPE = recipe.o;
                config.TITLE_RECIPE = `E${recipe.e}:O${recipe.o}`;
                config.PORT = recipe.port;

                const app = createApp(container);
                await app.runTask("Market Begin", app.tradeMarket);

                const cronExpression = recipe.e === "s" || recipe.o === "s" ? "*/5 * * * *" : "*/5 * * * *";
                cron.schedule(cronExpression, () => app.runTask("Scheduled Market", app.tradeMarket));
                cron.schedule(cronExpression, () => app.runTask("Scheduled Future", app.tradeFuture));

                if (IS_PRODUCTION) {
                    cron.schedule(cronExpression, () => app.runTask("Scheduled L&S Signal", app.startSignalLnS));
                }
            })
            .filter(Boolean);
        await Promise.all(tasks);
    } else {
        const app = createApp(container);
        const tasks = [
            IS_UAT && app.runTask("Test", app.startTest),
            IS_ANALYST_MARKET && app.runTask("Analyst Market", app.analyzeMarket),
            IS_ANALYST_HISTORY && app.runTask("Analyst History", app.analyzeHistory),
        ].filter(Boolean);
        await Promise.all(tasks);
    }
};

const createApp = (container) => {
    const history = createHistory(container),
        market = createMarket(container),
        eligible = createEligible(container),
        analyst = createAnalyst(history, market),
        signal = createSignal(container, eligible),
        test = createTest(container, eligible),
        trader = createTrader(container, eligible);

    return new App(container, signal, analyst, test, trader);
};

try {
    await runApps(container);
} catch (error) {
    container.get("logger").error("An error occurred:", error);
}
