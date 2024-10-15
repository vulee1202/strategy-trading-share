import { createRequire } from "module";
const require = createRequire(import.meta.url);
const amqp = require("amqplib");

class RabbitMQ {
    #connection;
    #channel;
    #config;
    #logger;
    #fileManager;
    #validator;
    #queues;

    constructor(config, logger, fileManager, validator) {
        this.#config = config;
        this.#logger = logger;
        this.#fileManager = fileManager;
        this.#validator = validator;
        this.#connection = null;
        this.#channel = null;
        this.#queues = [];
    }

    connect = async (retries = 5, delay = 2000) => {
        try {
            this.#logger.info("Connecting to RabbitMQ...");
            if (!this.#connection) {
                this.#connection = await amqp.connect(this.#config.RABBITMQ_URL);
                this.#channel = await this.#connection.createChannel();
            }
            this.#logger.info("Connected to RabbitMQ.");
            await this.#triggerReceiveIfNeeded(this.#fileManager.queue);
        } catch (error) {
            this.#logger.debug("RABBITMQ_URL: " + this.#config.RABBITMQ_URL);
            this.#logger.error("Error connecting to RabbitMQ", error);
            if (retries > 0) {
                this.#logger.info(`Retrying connection... (${retries} retries left)`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.connect(retries - 1, delay);
            }
            this.#logger.error("Failed to connect to RabbitMQ after multiple attempts.");
            throw error;
        }
    };

    checkMessages = async (queueName) => {
        try {
            const queue = await this.#channel.checkQueue(queueName);
            if (queue.messageCount > 0) {
                await this.#triggerReceiveIfNeeded(queueName);
                this.#logger.info(`Messages exist in queue ${queueName}: ${queue.messageCount}`);
                throw new Error("Please wait for messages to be done before continuing...");
            } else {
                this.#logger.info(`No messages in queue ${queueName}`);
            }
        } catch (error) {
            this.#logger.error("Error checking messages:", error);
            throw error;
        }
    };

    send = async (queueName, message) => {
        await this.#triggerReceiveIfNeeded(queueName);
        this.#channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    };

    // Trigger if needed
    #triggerReceiveIfNeeded = async (queueName) => {
        await this.#channel.assertQueue(queueName, { durable: true });
        if (!this.#queues.includes(queueName)) {
            this.#queues.push(queueName);
            this.#triggerReceive(queueName);
        }
    };

    #triggerReceive = async (queue) => {
        try {
            for await (const msg of this.#receive(queue)) {
                if (queue === this.#fileManager.queue) {
                    await this.#writeFile(msg);
                }
            }
        } catch (error) {
            this.#logger.error(`Error triggering receive for queue: ${queue}`, error);
        }
    };

    #receive = async function* (queue) {
        while (true) {
            const msg = await this.#channel.get(queue, { noAck: false });
            if (msg) {
                this.#channel.ack(msg);
                yield msg.content.toString();
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    };

    #close = async () => {
        await this.#channel.close();
        await this.#connection.close();
    };

    #writeFile = async (message) => {
        const isValidJSON = this.#validator.isValidJSON(message);
        if (!isValidJSON) {
            this.#logger.error(`Error writing file from message queue: ${message}`);
            return;
        }
        await this.#fileManager.writeFileFromQueue(JSON.parse(message));
    };
}

export default (config, logger, fileManager, validator) => new RabbitMQ(config, logger, fileManager, validator);
