import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, ThemeProvider as MuiThemeProvider, Menu, MenuItem } from "@mui/material";
import { AutoGraph } from "@mui/icons-material"; // Import the icon
import "./css/App.css";
import LiveData from "./components/LiveData";
import { useTheme, themeNames as themes } from "./ThemeContext"; // Import the useTheme hook
import logo from "./images/logo.png"; // Move the logo.png file to the same directory as the App.js file

function App() {
    const { theme, setTheme } = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (themeName) => {
        setTheme(themeName);
        setAnchorEl(null);
    };

    return (
        <MuiThemeProvider theme={theme}>
            <div className="App">
                <AppBar position="fixed">
                    <Toolbar>
                        <img src={logo} alt="Logo" style={{ width: "32px", height: "32px", marginRight: "8px" }} />
                        <Typography variant="h6" className="App-title">
                            VULCANA FOENIX
                        </Typography>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                            <Button color="inherit" onClick={handleMenuClick}>
                                Select Theme <AutoGraph style={{ marginLeft: "4px" }} /> {/* Add icon here */}
                            </Button>
                        </div>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {themes.map((theme) => (
                                <MenuItem
                                    key={theme.name}
                                    onClick={() => handleMenuClose(theme.name)}
                                    style={{ backgroundColor: theme.mainColor }}
                                >
                                    {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Toolbar>
                </AppBar>
                <div style={{ marginTop: "80px" }}>
                    <LiveData />
                </div>
            </div>
        </MuiThemeProvider>
    );
}

export default App;
