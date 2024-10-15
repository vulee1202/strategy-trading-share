import React, { createContext, useContext, useState } from "react";
import { createTheme } from "@mui/material/styles";

const ThemeContext = createContext();

const themes = {
    light: createTheme({
        palette: {
            mode: "light",
        },
    }),
    dark: createTheme({
        palette: {
            mode: "dark",
        },
    }),
    premium: createTheme({
        palette: {
            mode: "light",
            primary: {
                main: "#673ab7", // Purple
            },
            secondary: {
                main: "#ff4081", // Pink
            },
            background: {
                default: "#f5f5f5",
                paper: "#ffffff",
            },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontWeight: 700,
            },
            h2: {
                fontWeight: 600,
            },
        },
    }),
};

export const themeNames = Object.keys(themes).map((theme) => ({
    name: theme,
    mainColor: themes[theme].palette.primary.main || null,
}));

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState("light");

    const theme = themes[currentTheme];

    const setTheme = (themeName) => {
        if (themes[themeName]) {
            setCurrentTheme(themeName);
        }
    };

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
