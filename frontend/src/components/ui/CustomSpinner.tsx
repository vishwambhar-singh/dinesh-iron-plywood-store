import { Center, Spinner, Text, VStack } from "@chakra-ui/react";

interface CustomSpinnerProps {
  message?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  height?: string | number;
  color?: string;
}

export const CustomSpinner = ({
  message = "Loading...",
  size = "xl",
  height = "300px",
  color = "brand.600",
}: CustomSpinnerProps) => {
  return (
    <Center height={height} width="100%">
      <VStack gap={4}>
        <Spinner
          size={size}
          color={color}
          borderWidth="4px"
          animationDuration="0.65s"
        />
        {message && (
          <Text fontSize="sm" fontWeight="medium" color="fg.muted">
            {message}
          </Text>
        )}
      </VStack>
    </Center>
  );
};
