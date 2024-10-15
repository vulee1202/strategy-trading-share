import { createRequire } from "module";
import ccxt from "ccxt";
import createLogger from "./utils/logger.js";
import config from "./utils/config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { promisify } from "util";
import zlib from "zlib";
import express from "express";
import cors from "cors";
import createChart from "./utils/chart.js";
import createFormatter from "./utils/formatter.js";
import createConverter from "./utils/converter.js";
import createIndicator from "./helper/indicators.js";
import createFileManager from "./service/file.js";
import createSummaryModel from "./model/summary.js";
import createMarket from "./helper/market.js";
import createCalculation from "./helper/calculation.js";
import createSSE from "./service/sse.js";
import createEmailSender from "./service/email.js";
import createValidator from "./utils/validator.js";
import os from "os";
import createRabbitMQ from "./service/RabbitMQ.js";
import createRedis from "./service/Redis.js";
import createCache from "./service/cache.js";
const require = createRequire(import.meta.url);

const httpAgent = new HttpsProxyAgent(`http://192.168.1.1/`);

const OS = os.platform();
let Service;

if (OS === "win32") {
    const { Service: WindowsService } = require("node-windows");
    Service = WindowsService;
}

class DependencyContainer {
    #dependencies = new Map();

    register(name, instance) {
        this.#dependencies.set(name, instance);
    }

    get(name) {
        if (!this.#dependencies.has(name)) {
            throw new Error(`Dependency ${name} not found`);
        }
        return this.#dependencies.get(name);
    }
}

const createDependencies = () => {
    const container = new DependencyContainer();

    config.OS = OS;
    const userConfig = config.IS_PRODUCTION
        ? {
              apiKey: config.APP_KEY,
              secret: config.APP_SECRET,
              httpAgent,
          }
        : { apiKey: config.APP_KEY, secret: config.APP_SECRET };
    const userFutuConfig = {
        ...userConfig,
        options: {
            defaultType: "future",
            warnOnFetchOpenOrdersWithoutSymbol: false,
        },
    };

    const fetchExchange = new ccxt.binance();
    const spotExchange = new ccxt.binance(userConfig);
    const futuExchange = new ccxt.binance(userFutuConfig);

    if (config.IS_STAGING) {
        spotExchange.setSandboxMode(true);
    }

    const formatter = createFormatter(config);
    const logger = createLogger(config, formatter);
    const validator = createValidator(logger);
    const compress = promisify(zlib.gzip);
    const decompress = promisify(zlib.gunzip);
    const sse = createSSE(config);
    const converter = createConverter(config);
    const fileManager = createFileManager(config, logger, compress, decompress, validator, converter);
    const rabbitMQ = createRabbitMQ(config, logger, fileManager, validator);
    const chart = createChart(config, logger);
    const app = express();
    const redis = createRedis(config, logger, converter, validator);
    const cache = createCache(config, logger, converter, redis);
    const market = createMarket(
        fetchExchange,
        spotExchange,
        futuExchange,
        cache,
        logger,
        config,
        converter,
        formatter,
        fileManager
    );
    const indicator = createIndicator(formatter, cache);
    const summaryModel = createSummaryModel(config, market, chart, fileManager, formatter, sse, rabbitMQ);
    const calculation = createCalculation(config, logger, converter, summaryModel, formatter, market);
    const emailSender = createEmailSender(config);

    app.use(cors());

    container.register("fetchExchange", fetchExchange);
    container.register("spotExchange", spotExchange);
    container.register("futuExchange", futuExchange);
    container.register("cache", cache); // Register cache
    container.register("logger", logger);
    container.register("config", config);
    container.register("compress", compress);
    container.register("decompress", decompress);
    container.register("converter", converter);
    container.register("chart", chart);
    container.register("formatter", formatter);
    container.register("indicator", indicator);
    container.register("fileManager", fileManager);
    container.register("market", market);
    container.register("summaryModel", summaryModel);
    container.register("calculation", calculation);
    container.register("expressApp", app);
    container.register("sse", sse);
    container.register("emailSender", emailSender);
    container.register("Service", Service);
    container.register("validator", validator);
    container.register("rabbitMQ", rabbitMQ);

    return container;
};

const container = createDependencies();

try {
    const rabbitMQ = container.get("rabbitMQ");
    await rabbitMQ.connect();
    const cacher = container.get("cache");
    await cacher.connect();
    const model = container.get("summaryModel");
    await model.refreshBalance();
    const logger = container.get("logger");
    logger.info("Dependencies initialized successfully");
} catch (error) {
    throw error;
}

export default container;
