import React, { useState, useEffect } from "react";
import Tabs from "./Tabs";
import { CircularProgress, Box } from "@mui/material";

const LiveData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const urls = process.env.REACT_APP_API_URLS.split(",");
        const eventSources = [];

        const fetchData = (url) => {
            try {
                console.log("Fetching data in " + url);
                const eventSource = new EventSource(url);
                eventSource.onmessage = (event) => {
                    const newData = JSON.parse(event.data);
                    setData((prevData) => {
                        const updatedData = prevData.filter((item) => item.title !== newData.title);
                        return [...updatedData, newData].sort((a, b) => a.title.localeCompare(b.title));
                    });
                    setLoading(false);
                };
                eventSources.push(eventSource);
            } catch (error) {}
        };

        urls.forEach(fetchData);

        return () => {
            eventSources.forEach((eventSource) => eventSource.close());
        };
    }, []);

    return <Box>{loading ? <CircularProgress style={{ marginTop: "40vh" }} /> : <Tabs data={data} />}</Box>;
};

export default LiveData;
