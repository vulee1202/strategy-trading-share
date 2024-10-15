import container from "./startup.js";

class Trigger {
    #logger;
    #config;
    #formatter;
    #market;
    #model;
    #EventManager;

    constructor(logger, config, formatter, market, model) {
        this.#logger = logger;
        this.#config = config;
        this.#formatter = formatter;
        this.#market = market;
        this.#model = model;
        this.#EventManager = {
            SELL_ALL: async () => this.#sellAllSymbol(),
            FETCH_BALANCE: async () => this.#fetchSpotBalance(),
            SWAP_FUTURE: async () => this.#swapFutureOrder(),
        };
    }

    trigger = async () => {
        const event = this.#config.TRIGGER_EVENT;
        this.#logger.info(`Triggering event: ${event}`);
        await this.#EventManager[event]();
    };

    #fetchSpotBalance = async () => {
        await this.#model.refreshBalance();
        this.#logger.info("Balances: " + JSON.stringify(this.#model.balance));
    };

    #sellAllSymbol = async () => {
        const symbols = await this.#market.fetchSymbol();
        const promise = symbols.map(async (symbol) => {
            try {
                const summarySymbol = symbol.substring(0, symbol.indexOf("/"));
                await this.#market.sell(summarySymbol, 0, this.#model.balance[summarySymbol]);
            } catch (err) {
                this.#logger.error(`Sell Error for ${symbol}`);
            }
        });
        await Promise.all(promise);
    };

    #swapFutureOrder = async () => {
        this.#logger.info("Swapping future order");

        const payload = {
            symbol: "GAS/USDT",
            side: "buy",
            price: 1.5,
            invest: 1,
            leverage: 10,
        };

        await this.#market.swapFutureOrder(payload);
    };
}

const createTrigger = new Trigger(
    container.get("logger"),
    container.get("config"),
    container.get("formatter"),
    container.get("market"),
    container.get("summaryModel")
);

createTrigger.trigger();
