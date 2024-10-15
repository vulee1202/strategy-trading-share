import React, { useState } from "react"; // Import useState
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel, // Import TableSortLabel for sorting
} from "@mui/material";
import { AccessTime, MonetizationOn } from "@mui/icons-material"; // Import icons

const TableComponent = ({ dataset }) => {
    // Convert dataset arrays to an object
    const formattedDataset = dataset.labels.map((label, index) => ({
        label,
        pnl: dataset.pnls[index],
        fpl: dataset.fpls[index],
        invest: dataset.invests[index],
    }));

    const [page, setPage] = useState(0); // State for current page
    const [rowsPerPage, setRowsPerPage] = useState(5); // State for rows per page
    const [order, setOrder] = useState("asc"); // State for sorting order
    const [orderBy, setOrderBy] = useState("time"); // State for sorting column

    const handleChangePage = (event, newPage) => {
        setPage(newPage); // Update current page
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10)); // Update rows per page
        setPage(0); // Reset to first page
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const sortedData = [...formattedDataset].sort((a, b) => {
        let aValue, bValue; // Declare variables for values

        // Determine the value to sort by based on orderBy
        if (orderBy === "pnl") {
            aValue = a.pnl;
            bValue = b.pnl;
        } else if (orderBy === "fpl") {
            aValue = a.fpl;
            bValue = b.fpl;
        } else if (orderBy === "invest") {
            aValue = a.invest;
            bValue = b.invest;
        } else {
            aValue = new Date(a.label).getTime(); // Convert label to date for sorting
            bValue = new Date(b.label).getTime(); // Convert label to date for sorting
        }

        return order === "asc" ? aValue - bValue : bValue - aValue;
    });

    return (
        <Paper elevation={3} style={{ margin: "16px 0", padding: "16px" }}>
            <Typography variant="h6">{dataset.title}</Typography>
            <TableContainer style={{ maxHeight: 440 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sortDirection={orderBy === "time" ? order : false} title="Time of the entry">
                                <TableSortLabel
                                    active={orderBy === "time"}
                                    direction={orderBy === "time" ? order : "asc"}
                                    onClick={() => handleRequestSort("time")}
                                >
                                    <AccessTime /> Time
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={orderBy === "pnl" ? order : false} title="Profit and Loss">
                                <TableSortLabel
                                    active={orderBy === "pnl"}
                                    direction={orderBy === "pnl" ? order : "asc"}
                                    onClick={() => handleRequestSort("pnl")}
                                >
                                    <MonetizationOn /> PNL
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={orderBy === "fpl" ? order : false} title="Final Profit and Loss">
                                <TableSortLabel
                                    active={orderBy === "fpl"}
                                    direction={orderBy === "fpl" ? order : "asc"}
                                    onClick={() => handleRequestSort("fpl")}
                                >
                                    <MonetizationOn /> FPL
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={orderBy === "invest" ? order : false} title="Investment Amount">
                                <TableSortLabel
                                    active={orderBy === "invest"}
                                    direction={orderBy === "invest" ? order : "asc"}
                                    onClick={() => handleRequestSort("invest")}
                                >
                                    <MonetizationOn /> Invest
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((data, index) => (
                            <TableRow key={index} hover>
                                <TableCell>{data.label}</TableCell>
                                <TableCell>{data.pnl.toFixed(4)}</TableCell>
                                <TableCell>{data.fpl.toFixed(4)}</TableCell>
                                <TableCell>{data.invest}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]} // Options for rows per page
                component="div"
                count={dataset.labels.length} // Total number of rows
                rowsPerPage={rowsPerPage} // Current rows per page
                page={page} // Current page
                onPageChange={handleChangePage} // Function to handle page change
                onRowsPerPageChange={handleChangeRowsPerPage} // Function to handle rows per page change
                labelRowsPerPage="Rows per page:" // Custom label for rows per page
            />
        </Paper>
    );
};

export default TableComponent;
