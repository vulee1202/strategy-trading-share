import { createRequire } from "module";

const require = createRequire(import.meta.url);
const asciichart = require("asciichart");
const colors = ["blue", "cyan", "red", "green", "yellow", "magenta"];

class Chart {
    #config;
    #logger;
    constructor(config, logger) {
        this.#config = config;
        this.#logger = logger;
    }

    drawChart = (datas) => {
        this.#draw(datas);
    };

    drawByModel = (dataChart) => {
        const { pnls, fpls, invests } = dataChart;
        this.#draw(pnls, "PNL Chart");
        this.#draw(fpls, "FPL Chart");
        this.#draw(invests, "Invest Chart");
        this.#logger.info(
            `[${this.#config.TITLE_RECIPE}] 🚀 ~ PNL: ${pnls.at(-1).toFixed(4)} 🚀 ~ FPL: ${fpls
                .at(-1)
                .toFixed(4)} 🚀 ~ Invest: ${invests.at(-1).toFixed(4)}`
        );
    };

    #draw = (datas, title = "") => {
        if (this.#config.IS_DRAW_CHART) {
            const color = asciichart[colors[Math.floor(Math.random() * colors.length)]];
            console.log(title);
            console.log(
                asciichart.plot([datas], {
                    height: 15,
                    colors: [color],
                })
            );
            console.log(); // Add a blank line after each chart
        }
    };
}

export default (config, logger) => new Chart(config, logger);
