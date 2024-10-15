import redis from "redis";

class Redis {
    #config;
    #logger;
    #converter;
    #validator;
    #client;

    constructor(config, logger, converter, validator, redis) {
        this.#config = config;
        this.#logger = logger;
        this.#converter = converter;
        this.#validator = validator;
        this.#initRedis(redis);
    }

    connect = async () => {
        if (!this.#client.isOpen) {
            let retries = 5; // Number of retries
            let delay = 1000; // Initial delay in milliseconds

            while (retries) {
                try {
                    await this.#client.connect();
                    return;
                } catch (err) {
                    this.#logger.error("Redis connection error:", err);
                    retries -= 1; // Decrease the number of retries
                    this.#logger.info(`Reconnecting to Redis... Retries left: ${retries}`);

                    if (retries === 0) {
                        this.#logger.error("All retries exhausted. Could not connect to Redis.");
                        process.exit(1); // Exit the process if you exhaust all retries
                    }

                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }
    };

    memoize = (fn) => {
        return async (...args) => {
            try {
                await this.connect();

                const hash = this.#converter.generateHash(JSON.stringify(args));

                return new Promise((resolve, reject) => {
                    this.#client.get(hash, async (err, result) => {
                        if (err) return reject(err);
                        if (result) return resolve(JSON.parse(result));

                        const computedResult = await fn(...args);
                        this.#client.set(hash, JSON.stringify(computedResult));
                        resolve(computedResult);
                    });
                });
            } catch (error) {
                this.#logger.error(error);
            }
        };
    };

    set = async (key, value) => {
        try {
            const stringValue = JSON.stringify(value);
            await this.#client.set(key, stringValue);
        } catch (err) {
            this.#logger.error("Error setting value in Redis:", err);
        }
    };

    get = async (key) => {
        try {
            const value = await this.#client.get(key);
            if (value !== null) {
                return JSON.parse(value);
            }
            return value;
        } catch (err) {
            this.#logger.error("Error getting value from Redis:", err);
        }
    };

    #initRedis = (redis) => {
        this.#client = redis.createClient({
            url: this.#config.REDIS_URL,
        });

        this.#client.on("connecting", () => {
            this.#logger.info("Connecting to Redis...");
        });

        this.#client.on("connect", () => {
            this.#logger.info("Connected to Redis");
        });

        this.#client.on("error", (err) => {
            this.#logger.error("Redis error to connect to URL: " + this.#config.REDIS_URL, err);
        });

        this.#client.on("end", () => {
            this.#logger.warn("Redis connection closed");
        });

        this.#client.on("reconnecting", () => {
            this.#logger.info("Reconnecting to Redis");
        });

        this.#client.on("close", () => {
            this.#logger.info("Closed connection to Redis");
        });

        this.#client.on("ready", () => {
            this.#logger.info("Redis is ready");
        });
    };

    #closeConnection = async () => {
        if (this.#client.connected) {
            await this.client.quit();
        }
    };
}

export default (config, logger, converter, validator) => new Redis(config, logger, converter, validator, redis);
