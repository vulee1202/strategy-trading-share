import { promises as fs } from "fs";
import path from "path";

class FileManager {
    #config;
    #logger;
    #compress;
    #decompress;
    #fullPath;
    #validator;
    #queue;
    #converter;

    constructor(config, logger, compress, decompress, validator, converter) {
        this.#config = config;
        this.#logger = logger;
        this.#compress = compress;
        this.#decompress = decompress;
        this.#validator = validator;
        this.#converter = converter;
        this.#queue = "File_Writer";
        this.#fullPath = this.#initFullPath();
    }

    get queue() {
        return this.#queue;
    }

    get fullPath() {
        return this.#fullPath;
    }

    async createFolder(fullPathFol = this.#fullPath, isRoot) {
        await fs.mkdir(fullPathFol, { recursive: true });
        if (!isRoot) this.#fullPath = fullPathFol;
    }

    async writeFileFromQueue(message) {
        const { symbol, data, fullFolPath } = message;
        if (!this.#validator.isJSONObject(data)) {
            this.#logger.error(
                `Error writing file by: ${symbol}, file path: ${fullFolPath} and with summaryData: ${data}`
            );
            return;
        }

        const summarySymbol = symbol.replace(/\//g, "");
        const filePath = path.join(fullFolPath, `${summarySymbol}.json`);
        this.#checkFileId(data, filePath);
        const historiesFilePath = path.join(path.dirname(filePath), `${summarySymbol}.histories`);

        if (data.histories && data.histories.length >= 3) {
            let existingHistories =
                (await this.#readFileIfExists(historiesFilePath, this.#readFileDecompressAsync.bind(this))) || [];
            const allHistories = [...data.histories.slice(1), ...existingHistories];
            const uniqueHistories = Array.from(new Set(allHistories.map(JSON.stringify))).map(JSON.parse);

            await this.#writeFileCompressAsync(historiesFilePath, uniqueHistories);

            data.histories = data.histories.slice(0, 1);
        }

        await this.#writeFileAsync(filePath, data);
    }

    async readFile(symbol, isAnalyst = false) {
        if (this.#config.IS_UAT) return null;

        const summarySymbol = symbol.replace(/\//g, "");
        const filePath = path.join(this.#fullPath, `${summarySymbol}.json`);
        const historiesFilePath = path.join(path.dirname(filePath), `${summarySymbol}.histories`);

        const mainFileData = await this.#readFileIfExists(filePath, this.#readFileAsync.bind(this));
        if (mainFileData) {
            if (isAnalyst) {
                const parsedHistories = await this.#readFileIfExists(
                    historiesFilePath,
                    this.#readFileDecompressAsync.bind(this)
                );
                if (parsedHistories) {
                    mainFileData.histories =
                        mainFileData.histories && mainFileData.histories.length > 0
                            ? [...mainFileData.histories, ...parsedHistories]
                            : parsedHistories;
                }
            }
            return mainFileData;
        }
        return null;
    }

    async readFileRootData(symbol, timeframe = this.#config.SPOT_TIME_FRAME) {
        if (!this.#config.IS_UAT) return [];

        const summarySymbol = symbol.replace(/\//g, "");
        const folderPath = path.join(this.#config.DATABASE_ROOT_DATA_PATH, timeframe);
        await this.createFolder(folderPath, true);

        const filePath = path.join(folderPath, `${summarySymbol}.json`);
        return (await this.#readFileIfExists(filePath, this.#readFileDecompressAsync.bind(this))) || [];
    }

    async writeFileRootData(symbol, data, timeframe = this.#config.SPOT_TIME_FRAME) {
        if (!this.#config.IS_UAT) return;
        if (!this.#validator.isArray(data)) {
            this.#logger.error(`Error writing file root by: ${symbol}, with data ${data}:`);
            return;
        }

        const summarySymbol = symbol.replace(/\//g, "");
        const folderPath = path.join(this.#config.DATABASE_ROOT_DATA_PATH, timeframe);
        const filePath = path.join(folderPath, `${summarySymbol}.json`);

        try {
            await this.#writeFileCompressAsync(filePath, data);
        } catch (err) {
            this.#logger.error(`Error writing root data file ${filePath}:`, err);
        }
    }

    // Helper methods
    genFolderName(percent, maxPercent = -75) {
        if (!this.#config.IS_UAT) return "";

        const folderParts = [
            this.#config.IS_ELIGIBLE_STRATEGY ? "ELI_" : "",
            this.#config.IS_CUT_LOSS
                ? `CUT_${percent}`
                : `DCA_${this.#config.TOTAL_DCA}${percent}${this.#config.IS_LINEAR ? `_LINEAR_MAX${maxPercent}` : ""}`,
            this.#config.IS_COMPOUNDING ? `_CPD${this.#config.COMPOUNDING}` : "",
            `_TP+${this.#config.PROFIT_PERCENT}_${this.#config.SPOT_TIME_FRAME}_E${this.#config.ENTRY_RECIPE}O${
                this.#config.OUTRY_RECIPE
            }/`,
        ];

        return folderParts.join("");
    }

    async #readFileDecompressAsync(filePath) {
        try {
            const compressedData = await fs.readFile(filePath);
            try {
                const decompressedData = await this.#decompress(compressedData);
                return JSON.parse(decompressedData);
            } catch (error) {
                this.#logger.error(`Error decompressing file ${filePath}:`, error);
                return JSON.parse(compressedData);
            }
        } catch (error) {
            this.#logger.error(`Error reading and decompressing file ${filePath}:`, error);
            throw error;
        }
    }

    async #readFileAsync(filePath) {
        try {
            const data = await fs.readFile(filePath, "utf8");
            return JSON.parse(data);
        } catch (error) {
            this.#logger.error(`Error reading file ${filePath}:`, error);
            throw error;
        }
    }

    async #writeFileCompressAsync(filePath, data) {
        try {
            if (!this.#validator.isValidJSON(data)) {
                throw new Error("Input data is not a valid JSON object: " + JSON.stringify(data));
            }

            const jsonData = JSON.stringify(data);

            const compressedData = await this.#compress(jsonData);

            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(filePath, compressedData);
        } catch (error) {
            this.#logger.error(`Error compressing and writing file ${filePath}:`, error);
            throw error;
        }
    }

    async #writeFileAsync(filePath, data) {
        try {
            if (!this.#validator.isValidJSON(data)) {
                throw new Error("Input data is not a valid JSON object: " + JSON.stringify(data));
            }

            const jsonData = JSON.stringify(data, null, 4);
            // this.#logger.debug(`Final JSON data by path ${filePath}: ${jsonData}`);

            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, "", "utf8"); // Clears the file before writing new content
            await fs.writeFile(filePath, jsonData, "utf8");
        } catch (error) {
            this.#logger.error(`Error writing to file ${filePath}: ${error.message}`, error);
            throw error;
        }
    }

    async #fileExists(filePath) {
        try {
            await fs.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async #readFileIfExists(filePath, readFunction) {
        if (await this.#fileExists(filePath)) {
            return await readFunction(filePath);
        }
        return null;
    }

    #initFullPath() {
        const recipe = `E${this.#config.ENTRY_RECIPE ?? ""}O${this.#config.OUTRY_RECIPE ?? ""}`;

        if (this.#config.IS_STAGING) return `${this.#config.DATABASE_PATH}/${recipe}/`;
        else if (this.#config.IS_PRODUCTION) return `${this.#config.DATABASE_PATH}/`;

        return this.#config.DATABASE_PATH;
    }

    #generateFileId = (filePath) => this.#converter.generateHash(filePath);

    #checkFileId = (data, filePath) => {
        if (!data.id) data.id = this.#generateFileId(filePath);
        else {
            const fileId = this.#generateFileId(filePath);
            if (fileId !== data.id) {
                data.id = fileId;
                this.#logger.debug(`File ID mismatch for file ${filePath}, expected ${data.id} but got ${fileId}`);
                // throw new Error(`File ID mismatch for file ${filePath}`);
            }
        }
    };
}

export default (config, logger, compress, decompress, validator, converter) =>
    new FileManager(config, logger, compress, decompress, validator, converter);
