import React, { useState } from "react";
import { Paper, Typography, Button, Tooltip } from "@mui/material";
import { CopyAll, ExpandMore, ExpandLess } from "@mui/icons-material"; // Import icons
import { JSONTree } from "react-json-tree"; // Change to named import

const JsonView = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false); // State to track expansion
    const [tooltipOpen, setTooltipOpen] = useState(false);
    
    const jsonString = JSON.stringify(data, null, 2);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonString).then(() => {
            setTooltipOpen(true);
            setTimeout(() => setTooltipOpen(false), 2000);
        });
    };

    return (
        <Paper elevation={3} style={{ padding: "16px", margin: "16px 0" }}>
            <Typography variant="h6">{data.title}</Typography>
            <Tooltip title="Copied to clipboard!" open={tooltipOpen} arrow>
                <span>
                    <Button variant="contained" color="primary" onClick={copyToClipboard} startIcon={<CopyAll />}>
                        Copy to Clipboard
                    </Button>
                </span>
            </Tooltip>
            {/* Use JSONTree for enhanced JSON visualization */}
            <div style={{ maxHeight: isExpanded ? "none" : "300px", overflow: "auto" }}>
                <JSONTree data={data} invertTheme={false} /> {/* Enhanced JSON view */}
            </div>
            <Button
                variant="outlined"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ marginTop: "10px" }}
                startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            >
                {isExpanded ? "Collapse" : "Expand"}
            </Button>
        </Paper>
    );
};

export default JsonView;
