class Validator {
    #logger;
    constructor(logger) {
        this.#logger = logger;
    }

    isJSONObject = (data) =>
        data != null &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        data.constructor === Object &&
        Object.keys(data).length > 0;

    isArray = (data) => Array.isArray(data);

    isValidJSON = (str) => {
        try {
            let json = str;
            if (typeof str === "string") {
                json = JSON.parse(str);
            }
            return this.#areAllObjectsOrAllArray(json);
        } catch (e) {
            this.#logger.error(`Error parsing in isValidJSON`, e);
            return false;
        }
    };

    #areAllObjectsOrAllArray = (data) =>
        this.isArray(data) ? data.every(this.isArray) || data.every(this.isJSONObject) : this.isJSONObject(data);
}

export default (logger) => new Validator(logger);
