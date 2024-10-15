import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables, Tooltip } from "chart.js";
import { Paper } from "@mui/material";

Chart.register(...registerables, Tooltip);

const ChartComponent = ({ data }) => {
    const chartData = {
        labels: data.labels || [],
        datasets: [
            {
                label: "PNL",
                data: data.pnls || [],
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
                fill: true,
            },
            {
                label: "FPL",
                data: data.fpls || [],
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
                fill: true,
            },
            {
                label: "Invest",
                data: data.invests || [],
                backgroundColor: "rgba(255, 206, 86, 0.6)",
                borderColor: "rgba(255, 206, 86, 1)",
                borderWidth: 1,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
            },
            title: {
                display: true,
                text: `Trading Dashboard ${data.title}`,
            },
        },
        scales: {
            x: {
                title: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: "USDT",
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <Paper elevation={3} style={{ padding: "16px", margin: "16px 0" }}>
            <div className="chart-container">
                <Line data={chartData} options={options} />
            </div>
        </Paper>
    );
};

export default ChartComponent;
