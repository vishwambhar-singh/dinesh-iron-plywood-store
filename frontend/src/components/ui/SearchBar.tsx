import { Input, Box } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { InputGroup } from "@chakra-ui/react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  width?: string | object;
}

const SearchBar = ({
  placeholder = "Search...",
  value,
  onChange,
  width = { base: "full", md: "320px" },
}: SearchBarProps) => {
  return (
    <Box width={width}>
      <InputGroup flex="1" startElement={<LuSearch color="gray.400" />}>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          variant="outline"
          bg="white"
          borderRadius="lg"
          _focus={{ borderColor: "brand.500", boxShadow: "none" }}
        />
      </InputGroup>
    </Box>
  );
};

export default SearchBar;
