import { Table, Box, HStack, Text, IconButton, Stack } from "@chakra-ui/react";
import { useState } from "react";
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";
import { ReactNode } from "react";

interface Column {
  label: string;
  align?: "start" | "center" | "end";
  width?: string | { [key: string]: string };
}

interface CustomTableProps<T> {
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  maxRows?: number;
}

export const CustomTable = <T,>({
  columns,
  data,
  renderRow,
  maxRows = 10,
}: CustomTableProps<T>) => {
  const [page, setPage] = useState(0);

  const totalRows = data.length;
  const totalPages = maxRows ? Math.ceil(totalRows / maxRows) : 1;
  const startRow = page * maxRows;
  const endRow = startRow + maxRows;
  const paginatedData = maxRows ? data.slice(startRow, endRow) : data;

  const goToFirstPage = () => setPage(0);
  const goToLastPage = () => setPage(totalPages - 1);
  const handlePrevious = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));

  return (
    <Box
      bg="bg.panel"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.subtle"
      overflow="hidden"
      width="100%"
    >
      <Box overflowX="auto" width="100%">
        <Table.Root striped>
          <Table.Header>
            <Table.Row bg="bg.canvas">
              {columns.map((col, idx) => (
                <Table.ColumnHeader
                  key={idx}
                  textAlign={col.align || "start"}
                  width={col.width}
                  px={4}
                  py={3}
                  whiteSpace="nowrap"
                >
                  {col.label}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedData.map((item, index) => renderRow(item, index))}
          </Table.Body>
        </Table.Root>
      </Box>

      {maxRows && totalRows > 0 && (
        <Stack
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align="center"
          p={4}
          bg="bg.canvas"
          borderTopWidth="1px"
          borderColor="border.subtle"
          gap={4}
        >
          <Text fontSize="sm" color="fg.muted">
            Showing <b>{startRow + 1}</b>-<b>{Math.min(endRow, totalRows)}</b>{" "}
            of <b>{totalRows}</b>
          </Text>

          <HStack gap={1}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={goToFirstPage}
              disabled={page === 0}
              aria-label="First Page"
            >
              <MdFirstPage />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={page === 0}
              aria-label="Previous Page"
            >
              <MdNavigateBefore />
            </IconButton>

            <Text fontSize="xs" fontWeight="bold" px={2}>
              {page + 1} / {totalPages}
            </Text>

            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              aria-label="Next Page"
            >
              <MdNavigateNext />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={goToLastPage}
              disabled={page >= totalPages - 1}
              aria-label="Last Page"
            >
              <MdLastPage />
            </IconButton>
          </HStack>
        </Stack>
      )}
    </Box>
  );
};
