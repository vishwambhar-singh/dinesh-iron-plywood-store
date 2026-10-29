import {
  Box,
  Flex,
  Text,
  Avatar,
  VStack,
  HStack,
  Button,
  Separator,
  Card,
  Heading,
} from "@chakra-ui/react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { useColorMode } from "@/components/ui/color-mode";
import { useAuth } from "@/hooks/useAuth";

const ProfileSettings = () => {
  const { colorMode, setColorMode } = useColorMode();
  const { user } = useAuth();

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="xl"
      bg="bgMain"
      width="full"
    >
      <Flex direction={{ base: "column", lg: "row" }} gap={8} align="stretch">
        <Box flex="1">
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Profile
          </Text>
          <HStack align="center" gap={4}>
            <Avatar.Root
              size="lg"
              shape="rounded"
              border="2px solid"
              borderColor="brand.500"
            >
              <Avatar.Fallback
                name={user?.name}
                bg="brand.500"
                color="white"
                fontSize="2xl"
                fontWeight="bold"
                width="full"
                height="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              />
            </Avatar.Root>
            <VStack align="start" gap={1}>
              <Text fontWeight="bold" fontSize="xl">
                {user?.name || "User"}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {user?.email}
              </Text>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.500"
                textTransform="uppercase"
              >
                Role: {user?.role?.replace("_", " ")}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Separator
          orientation="vertical"
          display={{ base: "none", lg: "block" }}
        />

        <Box flex="1">
          <Card.Root variant="outline" borderColor="border.subtle">
            <Card.Header pb={2}>
              <Heading size="md" display="flex" alignItems="center" gap={2}>
                {colorMode === "light" ? <MdLightMode /> : <MdDarkMode />}{" "}
                Appearance
              </Heading>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} width="full">
                <Button
                  flex="1"
                  variant={colorMode === "light" ? "solid" : "outline"}
                  bg={colorMode === "light" ? "brand.solid" : "transparent"}
                  color={colorMode === "light" ? "white" : "fg.default"}
                  onClick={() => setColorMode("light")}
                  size="sm"
                >
                  <MdLightMode /> <Text ml={2}>Light</Text>
                </Button>
                <Button
                  flex="1"
                  variant={colorMode === "dark" ? "solid" : "outline"}
                  bg={colorMode === "dark" ? "brand.solid" : "transparent"}
                  color={colorMode === "dark" ? "fg.default" : "fg.default"}
                  onClick={() => setColorMode("dark")}
                  size="sm"
                >
                  <MdDarkMode /> <Text ml={2}>Dark</Text>
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Flex>
    </Box>
  );
};

export default ProfileSettings;
