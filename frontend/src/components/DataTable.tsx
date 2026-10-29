import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import api from '../utils/api';

interface Column {
    header: React.ReactNode;
    accessor: string;
    sortable?: boolean; // defaults to true
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data?: any[];
    loading?: boolean;
    emptyMessage?: string;
    pageSize?: number;
    searchable?: boolean; // defaults to true
    apiEndpoint?: string;
    refreshTrigger?: number;
}

type SortDir = 'asc' | 'desc' | null;

// Detect the type of a value for smart sorting
const detectType = (val: any): 'date' | 'number' | 'string' => {
    if (val === null || val === undefined || val === '') return 'string';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'string') {
        // ISO date / YYYY-MM-DD / timestamp pattern
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) return 'date';
        const num = Number(val);
        if (!isNaN(num) && val.trim() !== '') return 'number';
    }
    return 'string';
};

const compareValues = (a: any, b: any): number => {
    const type = detectType(a) || detectType(b);
    if (type === 'date') return new Date(a).getTime() - new Date(b).getTime();
    if (type === 'number') return Number(a) - Number(b);
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' });
};

const DataTable: React.FC<DataTableProps> = ({
    columns,
    data = [],
    loading = false,
    emptyMessage = 'No records found.',
    pageSize = 10,
    searchable = true,
    apiEndpoint,
    refreshTrigger = 0
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [serverData, setServerData] = useState<any[]>([]);
    const [serverTotal, setServerTotal] = useState(0);
    const [serverLoading, setServerLoading] = useState(false);

    const isServerSide = !!apiEndpoint;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page on search / sort change
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, sortCol, sortDir]);

    // Fetch Server Data
    useEffect(() => {
        if (!isServerSide) return;
        setServerLoading(true);
        
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: pageSize.toString()
        });
        
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (sortCol && sortDir) {
            params.append('sort', sortCol);
            params.append('dir', sortDir);
        }

        const url = apiEndpoint.includes('?') 
            ? `${apiEndpoint}&${params.toString()}` 
            : `${apiEndpoint}?${params.toString()}`;

        api.get(url)
            .then(res => {
                if (res.data && typeof res.data.total === 'number') {
                    setServerData(res.data.data || []);
                    setServerTotal(res.data.total);
                } else {
                    const arr = Array.isArray(res.data) ? res.data : [];
                    setServerData(arr);
                    setServerTotal(arr.length);
                }
            })
            .catch(err => {
                console.error('DataTable fetch error:', err);
                setServerData([]);
            })
            .finally(() => {
                setServerLoading(false);
            });
    }, [isServerSide, apiEndpoint, currentPage, pageSize, debouncedSearch, sortCol, sortDir, refreshTrigger]);

    // 1. Filter across all columns (Client Side)
    const filtered = useMemo(() => {
        if (isServerSide || !search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(row =>
            columns.some(col => {
                const val = row[col.accessor];
                return String(val ?? '').toLowerCase().includes(q);
            })
        );
    }, [data, search, columns, isServerSide]);

    // 2. Sort (Client Side)
    const sorted = useMemo(() => {
        if (isServerSide || !sortCol || !sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const cmp = compareValues(a[sortCol], b[sortCol]);
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortCol, sortDir, isServerSide]);

    // Clamp page if data length changes drastically (Client Side)
    useEffect(() => {
        if (isServerSide) return;
        const total = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > total) {
            setCurrentPage(total);
        }
    }, [filtered.length, pageSize, currentPage, isServerSide]);

    // 3. Paginate (Client Side)
    const clientTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const clientPaginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const displayData = isServerSide ? serverData : clientPaginated;
    const displayLoading = isServerSide ? serverLoading : loading;
    const displayTotalPages = isServerSide ? Math.max(1, Math.ceil(serverTotal / pageSize)) : clientTotalPages;
    const displayTotalRecords = isServerSide ? serverTotal : sorted.length;

    const handleSort = (accessor: string, sortable: boolean = true) => {
        if (!sortable) return;
        if (sortCol !== accessor) { setSortCol(accessor); setSortDir('asc'); return; }
        if (sortDir === 'asc') { setSortDir('desc'); return; }
        setSortCol(null); setSortDir(null);
    };

    const SortIcon = ({ accessor, sortable = true }: { accessor: string; sortable?: boolean }) => {
        if (!sortable) return null;
        if (sortCol !== accessor) return <ChevronsUpDown size={13} style={{ marginLeft: 4, opacity: 0.4, flexShrink: 0 }} />;
        if (sortDir === 'asc') return <ChevronUp size={13} style={{ marginLeft: 4, color: 'var(--brand-maroon)', flexShrink: 0 }} />;
        return <ChevronDown size={13} style={{ marginLeft: 4, color: 'var(--brand-maroon)', flexShrink: 0 }} />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Built-in search bar */}
            {searchable && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0 14px',
                    background: 'var(--panel-bg)',
                    width: '280px',
                    alignSelf: 'flex-end',
                }}>
                    <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            padding: '10px 0',
                            width: '100%',
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}
                        >×</button>
                    )}
                </div>
            )}

            <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col, index) => {
                                const isSortable = col.sortable !== false;
                                return (
                                    <th
                                        key={index}
                                        onClick={() => handleSort(col.accessor, isSortable)}
                                        style={{
                                            cursor: isSortable ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            {col.header}
                                            <SortIcon accessor={col.accessor} sortable={isSortable} />
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {displayLoading ? (
                            <>
                                <tr>
                                    <td colSpan={columns.length} style={{ padding: '16px 20px', background: 'rgba(160, 43, 43, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--brand-maroon)', fontSize: '0.9rem', fontWeight: 700 }}>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Loading records, please wait...</span>
                                        </div>
                                    </td>
                                </tr>
                                {[1, 2, 3, 4, 5].map(idx => (
                                    <tr key={`skeleton-${idx}`}>
                                        {columns.map((_, cIdx) => (
                                            <td key={`skeleton-col-${cIdx}`} style={{ padding: '16px' }}>
                                                <div
                                                    className="skeleton-shimmer"
                                                    style={{
                                                        height: '18px',
                                                        width: cIdx === 0 ? '70%' : cIdx === columns.length - 1 ? '45%' : `${65 + ((idx * 17 + cIdx * 23) % 30)}%`
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </>
                        ) : displayData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                    {search ? `No results matching "${search}"` : emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            displayData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex}>
                                            {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!displayLoading && displayTotalRecords > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border-color)',
                        background: 'rgba(0, 0, 0, 0.02)',
                        marginTop: 'auto',
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, displayTotalRecords)} of {displayTotalRecords}
                            {search && !isServerSide && data.length !== displayTotalRecords && ` (filtered from ${data.length})`}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="primary-btn"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >Previous</button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.85rem' }}>
                                Page {currentPage} of {displayTotalPages}
                            </span>
                            <button
                                className="primary-btn"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentPage === displayTotalPages ? 0.5 : 1, cursor: currentPage === displayTotalPages ? 'not-allowed' : 'pointer' }}
                                onClick={() => setCurrentPage(p => Math.min(displayTotalPages, p + 1))}
                                disabled={currentPage === displayTotalPages}
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
