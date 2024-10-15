import container from "./startup.js";

class SystemServiceManager {
    #Service;
    #logger;
    #config;

    constructor(Service, logger, config) {
        this.#Service = Service; // Changed to private field
        this.#logger = logger; // Changed to private field
        this.#config = config; // Changed to private field
    }

    createService() {
        const { ENTRY_RECIPE, OUTRY_RECIPE, IS_STAGING } = this.#config; // Accessing private field
        const recipe = `E${ENTRY_RECIPE}O${OUTRY_RECIPE}`;
        const envTitle = IS_STAGING === "TRUE" ? `Staging ${recipe}` : `Production ${recipe}`;

        const envs = Object.entries(this.#config).map(([name, value]) => ({
            name: name,
            value: String(value),
        }));

        return new this.#Service({
            name: envTitle,
            description: `Trading in ${envTitle}.`,
            script: "main.js",
            env: envs,
        });
    }

    setupEventHandlers = (svc) => {
        const eventHandlers = {
            install: () => {
                this.#logger.info("Service installed successfully.");
                svc.start();
            },
            start: () => this.#logger.info("Service started successfully."),
            stop: () => this.#logger.info("Service stopped."),
            error: (error) => this.#logger.error(`Service error: ${error.message}`),
            installError: (error) => this.#logger.error(`Service installation error: ${error.message}`), // Add specific error handler for installation
        };

        Object.entries(eventHandlers).forEach(([event, handler]) => {
            svc.on(event, handler);
        });
    };

    run = async () => {
        const recipes = this.#config.IS_STAGING
            ? [
                  //   { e: 8, o: 8, port: 6988, isEligibleStrategy: "TRUE", timeFrame: "1d", isEligibleByBTC: "F" },
                  //   {
                  //       e: 7,
                  //       o: 7,
                  //       port: 6977,
                  //       isEligibleStrategy: "F",
                  //       timeFrame: "15m",
                  //       isEligibleByBTC: this.#config.IS_ELIGIBLE_BY_BTC,
                  //   },
                  {
                      e: "s",
                      o: "s",
                      port: 3369,
                      isEligibleStrategy: "TRUE",
                      timeFrame: "15m",
                      isEligibleByBTC: "F",
                  },
              ]
            : [{ e: this.#config.ENTRY_RECIPE, o: this.#config.OUTRY_RECIPE, port: 3379 }];

        switch (this.#config.OS) {
            case "win32":
                this.#runByWindows(recipes);
                break;
            default:
                throw new Error("Unsupported operating system.");
        }
    };

    #runByWindows = (recipes) => {
        recipes.forEach((recipe) => {
            this.#config.PORT = recipe.port;
            this.#config.ENTRY_RECIPE = recipe.e;
            this.#config.OUTRY_RECIPE = recipe.o;
            this.#config.IS_ELIGIBLE_STRATEGY = recipe.isEligibleStrategy;
            this.#config.SPOT_TIME_FRAME = recipe.timeFrame;
            this.#config.IS_ELIGIBLE_BY_BTC = recipe.isEligibleByBTC;
            const svc = this.createService();
            this.setupEventHandlers(svc);
            svc.uninstall();
            svc.install();
        });
    };
}

const systemService = async () => {
    const serviceManager = new SystemServiceManager(container.get("Service"), container.get("logger"), process.env);
    await serviceManager.run();
};

systemService().catch((error) => {
    const logger = container.get("logger");
    logger.error("Failed to set up System service:", error);
    process.exit(1);
});
