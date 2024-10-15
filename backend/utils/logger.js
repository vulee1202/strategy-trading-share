import fs from "node:fs/promises";
import path from "node:path";
import ololog from "ololog";
import ansicolor from "ansicolor";

ansicolor.nice;
const log = ololog.configure({ locate: false });

class Logger {
    #logFilePath;
    #isOdd;
    #formatter;
    #config;
    #infoLogFilePath;
    #warnLogFilePath;
    #errorLogFilePath;
    #debugLogFilePath;

    constructor(
        config,
        formatter,
        logFilePath = "app.log",
        infoLogFilePath = "./logs/info.log",
        warnLogFilePath = "./logs/warn.log",
        errorLogFilePath = "./logs/error.log",
        debugLogFilePath = "./logs/debug.log"
    ) {
        this.#formatter = formatter;
        this.#config = config;
        this.#isOdd = false;
        this.#logFilePath = path.resolve(logFilePath);
        this.#infoLogFilePath = path.resolve(infoLogFilePath);
        this.#warnLogFilePath = path.resolve(warnLogFilePath);
        this.#errorLogFilePath = path.resolve(errorLogFilePath);
        this.#debugLogFilePath = path.resolve(debugLogFilePath);
    }

    info = (message) => this.#log(message, "INFO");

    warn = (message) => this.#log(message, "WARN");

    debug = (message) => this.#log(message, "DEBUG");

    error = (message, error = null) => this.#log(message, "ERROR", error);

    colorLog = (...args) => {
        const coloredArgs = args.map((arg) => arg);
        log(...coloredArgs, "\n");
    };

    simpleLog = (symbol, { histories, usdt }) => {
        const [lastHistory] = histories;
        const lastDCA = lastHistory?.isOutry ? 0 : lastHistory?.dcas.length ?? 0;
        const maxDCA = Math.max(0, ...histories.map((his) => his.dcas.length));

        const { positive, negative, pnl } = usdt;
        const totalCommand = positive + negative;
        const percentPositive = ((positive / totalCommand) * 100).toFixed(0);

        const formattedPnl = pnl.toFixed(4);
        this.#isOdd = !this.#isOdd;

        this.colorLog(
            this.#isOdd ? symbol.toString().bright.yellow : symbol.toString().bright.cyan,
            "-",
            this.#getColoredPercentage(percentPositive),
            `(${positive}/${totalCommand})`.cyan,
            "PnL:".blue,
            formattedPnl < 0 ? formattedPnl.red : formattedPnl > 0 ? formattedPnl.green : formattedPnl,
            "-",
            `${lastDCA}`.yellow + `/` + `${maxDCA}`.bright.red
        );
    };

    finalLog = (startDate, endDate, filePath, timeframe, total) => {
        const profitPer = (total.pnl / total.symbol) * 100;
        this.colorLog(
            "********** Summary *********".magenta,
            "\n\n",
            filePath.yellow,
            "\n",
            this.#formatter.toDateString(startDate).cyan,
            "-",
            this.#formatter.toDateString(endDate).cyan,
            "\n",
            "Total::: PnL:".blue,
            total.pnl < 0 ? total.pnl.toFixed(2).red : total.pnl.toFixed(2).green,
            "/",
            "FPL:".blue,
            total.fpl < 0 ? total.fpl.toFixed(2).red : total.fpl.toFixed(2).green,
            "\n",
            "Symbols:".blue,
            total.symbol.toString().yellow,
            "-",
            profitPer < 0 ? `${profitPer.toFixed(2)}%`.red : `${profitPer.toFixed(2)}%`.green,
            "-",
            "TF:".cyan,
            timeframe.toString().yellow,
            "\n",
            "Funding fee:".cyan,
            total.fundingFee.toFixed(4).red,
            "-",
            `${((total.fundingFee / total.symbol) * 100).toFixed(2)}%`.red
        );
    };

    signalLog = (symbol, isEntry, isOutry) => {
        if (isEntry) {
            this.colorLog(symbol.toString().bright.yellow, "-", "Entry".green);
        }
        if (isOutry) {
            this.colorLog(symbol.toString().bright.yellow, "-", "Outry".red);
        }
    };

    #log = async (message, level = "INFO", error = null) => {
        const timestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        let logEntry = `[${
            this.#config.IS_PRODUCTION ? "PRODUCTION" : "STAGING"
        }] [${timestamp}] [${level}] ${message}\n`;

        // Ensure log files exist
        const ensureLogFileExists = async (filePath) => {
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, ""); // Create the file if it doesn't exist
            }
        };

        await Promise.all([
            ensureLogFileExists(this.#infoLogFilePath),
            ensureLogFileExists(this.#warnLogFilePath),
            ensureLogFileExists(this.#errorLogFilePath),
            ensureLogFileExists(this.#debugLogFilePath),
        ]);

        // Log methods
        const errorLog = async () => {
            if (error) {
                logEntry += `Stack Trace:\n${error.stack}\n`;
                await this.debug(`Error occurred: ${message}`); // Log the error message at debug level
            }
            console.error(logEntry.trim());
            await fs.appendFile(this.#errorLogFilePath, logEntry);
        };

        const infoLog = async () => {
            console.info(logEntry.trim());
            await fs.appendFile(this.#infoLogFilePath, logEntry);
        };

        const warnLog = async () => {
            console.warn(logEntry.trim());
            await fs.appendFile(this.#warnLogFilePath, logEntry);
        };

        const debugLog = async () => {
            console.debug(logEntry.trim());
            await fs.appendFile(this.#debugLogFilePath, logEntry);
        };

        // Level methods map
        const levelMethods = {
            ERROR: errorLog,
            WARN: warnLog,
            DEBUG: debugLog,
            INFO: infoLog,
        };

        if (levelMethods[level]) {
            await levelMethods[level]();
        } else {
            console.warn(`Unknown log level: ${level}`);
        }

        try {
            await fs.appendFile(this.#logFilePath, logEntry);
        } catch (err) {
            console.error(`Error writing to log file (${this.#logFilePath}):`, err);
        }
    };

    #getColoredPercentage = (percentPositive) => {
        if (percentPositive < 50) return `${percentPositive}%`.red;
        if (percentPositive > 75) return `${percentPositive}%`.bright.green;
        if (percentPositive > 50) return `${percentPositive}%`.green;
        return `${percentPositive}%`;
    };
}

export default (config, formatter) => new Logger(config, formatter);
