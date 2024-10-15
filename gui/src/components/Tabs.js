import React, { useState } from "react";
import ChartComponent from "./Chart";
import JsonView from "./JsonView";
import TableComponent from "./Table"; // Import the new TableComponent
import { AppBar, Tabs, Tab, Box, Fade } from "@mui/material"; // Import Fade for animation
import { BarChart, Code, TableChart } from "@mui/icons-material"; // Import icons

const TabsComponent = ({ data }) => {
    const [activeTab, setActiveTab] = useState(0);

    // Set default tab to the first one
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <AppBar position="static" color="primary">
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                >
                    <Tab label="Chart" icon={<BarChart />} />
                    <Tab label="JSON" icon={<Code />} />
                    <Tab label="Table" icon={<TableChart />} />
                </Tabs>
            </AppBar>
            <Fade in={activeTab === 0}>
                <Box hidden={activeTab !== 0}>
                    {data.map((dataset) => (
                        <ChartComponent key={dataset.title} data={dataset} />
                    ))}
                </Box>
            </Fade>
            <Fade in={activeTab === 1}>
                <Box hidden={activeTab !== 1}>
                    {data.map((dataset) => (
                        <JsonView key={dataset.title} data={dataset} />
                    ))}
                </Box>
            </Fade>
            <Fade in={activeTab === 2}>
                <Box hidden={activeTab !== 2}>
                    {data.map((dataset) => (
                        <TableComponent
                            key={dataset.title} // Use dataset title as key
                            dataset={dataset}
                        />
                    ))}
                </Box>
            </Fade>
        </Box>
    );
};

export default TabsComponent;
