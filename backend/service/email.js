import nodemailer from "nodemailer";

class EmailSender {
    #config;
    #nodemailer;
    #emailConfig;

    constructor(config) {
        this.#config = config;
        this.#nodemailer = nodemailer;

        this.#emailConfig = {
            smtp: {
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: this.#config.EMAIL,
                    pass: this.#config.PASSWORD,
                },
            },
            sender: this.#config.EMAIL,
            receivers: this.#config.EMAIL_RECEIVER,
        };
    }

    async sendEmailSignal(symbols) {
        if (symbols.entries.length > 0 || symbols.entries.outries > 0)
            await this.#createEmailSignalSender(this.#emailConfig, {
                entrySymbols: symbols.entries,
                outrySymbols: symbols.outries,
            });
    }

    #createEmailSignalSender = async (config, { entrySymbols, outrySymbols }) => {
        const transporter = this.#createTransporter(this.#emailConfig.smtp);
        const receivers = config.receivers;
        const contents = [
            this.#createHtmlContent("LONG", "green", entrySymbols),
            this.#createHtmlContent("SHORT", "red", outrySymbols),
        ].join("");

        const mailOptions = {
            from: `Trade Signal <${config.sender}>`,
            subject: "[BINANCE] LONG & SHORT Signal",
            html: contents,
            "Content-Type": "text/html; charset=UTF-8",
        };
        await this.#triggerEmailSender(transporter, mailOptions, receivers);
    };

    #createTransporter = (config) =>
        this.#nodemailer.createTransport({
            service: config.service,
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass,
            },
        });

    #createHtmlContent = (title, color, symbols) =>
        `<b style='color:${color}'>${title}:</b><br>${symbols
            .map((symbol) => `- <b style='color:orange'>${symbol}</b><br>`)
            .join("")}`;

    #triggerEmailSender = async (transporter, mailOptions, receivers) => {
        try {
            await Promise.all(receivers.map((receiver) => transporter.sendMail({ ...mailOptions, to: receiver })));
            console.log(`Emails sent to all receivers`);
        } catch (error) {
            console.error("Error sending emails:", error);
        }
    };
}

export default (config) => new EmailSender(config);
