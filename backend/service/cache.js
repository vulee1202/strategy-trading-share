import NodeCache from "node-cache";

class Cache {
    #config;
    #logger;
    #converter;
    #redis;
    #nodeCache;
    #isMemoryCacheEnabled;

    constructor(config, logger, converter, redis) {
        this.#config = config;
        this.#logger = logger;
        this.#converter = converter;
        this.#redis = redis;
        this.#nodeCache = new NodeCache();
        this.#isMemoryCacheEnabled = true || this.#config.OS === "win32";
    }

    memoize = (fn) => {
        return async (...args) => {
            if (this.#isMemoryCacheEnabled) {
                const hash = this.#converter.generateHash(JSON.stringify(args));
                const cachedValue = await this.get(hash);
                if (cachedValue) return cachedValue;
                const result = await fn(...args);
                this.set(hash, result);
                return result;
            } else {
                const memoizedFn = this.#redis.memoize(fn);
                const result = await memoizedFn(...args);
                return result;
            }
        };
    };

    set = async (key, value) => {
        if (this.#isMemoryCacheEnabled) {
            this.#nodeCache.set(key, value);
        } else {
            await this.#redis.set(key, value);
        }
    };

    get = async (key) => {
        if (this.#isMemoryCacheEnabled) {
            return this.#nodeCache.get(key);
        } else {
            const data = await this.#redis.get(key);
            return data;
        }
    };

    connect = async () => {
        if (this.#isMemoryCacheEnabled) {
            this.#logger.info("Connected to in-memory cache.");
        } else {
            await this.#redis.connect();
        }
    };
}

export default (config, logger, converter, redis) => new Cache(config, logger, converter, redis);
