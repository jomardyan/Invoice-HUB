import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Box,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    CircularProgress,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';
import type { ReactNode } from 'react';

export interface Column<T> {
    id: keyof T | string;
    label: string;
    minWidth?: number;
    align?: 'left' | 'right' | 'center';
    format?: (value: any, row: T) => ReactNode;
}

export interface Action<T> {
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    color?: 'error' | 'primary' | 'secondary';
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSearch?: (search: string) => void;
    actions?: Action<T>[];
    isLoading?: boolean;
    searchPlaceholder?: string;
    emptyMessage?: string;
}

function DataTable<T extends { id: string }>({
    columns,
    data,
    total = 0,
    page = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    onSearch,
    actions,
    isLoading = false,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<T | null>(null);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearch(value);
        onSearch?.(value);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: T) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleActionClick = (action: Action<T>) => {
        if (selectedRow) {
            action.onClick(selectedRow);
        }
        handleMenuClose();
    };

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {/* Search Bar */}
            {onSearch && (
                <Box sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Box>
            )}

            {/* Table */}
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth, fontWeight: 600 }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                            {actions && actions.length > 0 && (
                                <TableCell align="right" style={{ minWidth: 70, fontWeight: 600 }}>
                                    Actions
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center">
                                    <Box py={4}>
                                        <CircularProgress />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center">
                                    <Box py={4}>
                                        <Typography color="text.secondary">{emptyMessage}</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow hover key={row.id}>
                                    {columns.map((column) => {
                                        const value = column.id.includes('.')
                                            ? column.id.split('.').reduce((obj: any, key) => obj?.[key], row)
                                            : (row as any)[column.id];
                                        return (
                                            <TableCell key={String(column.id)} align={column.align}>
                                                {column.format ? column.format(value, row) : value}
                                            </TableCell>
                                        );
                                    })}
                                    {actions && actions.length > 0 && (
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {onPageChange && onPageSizeChange && (
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={pageSize}
                    page={page}
                    onPageChange={(_, newPage) => onPageChange(newPage)}
                    onRowsPerPageChange={(event) => onPageSizeChange(parseInt(event.target.value, 10))}
                />
            )}

            {/* Actions Menu */}
            {actions && (
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {actions.map((action, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => handleActionClick(action)}
                            sx={{ color: action.color === 'error' ? 'error.main' : 'inherit' }}
                        >
                            {action.icon && <Box sx={{ mr: 1, display: 'flex' }}>{action.icon}</Box>}
                            {action.label}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </Paper>
    );
}

export default DataTable;
