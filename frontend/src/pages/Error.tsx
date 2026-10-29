import { Box, Center, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { MdErrorOutline, MdLockOutline } from "react-icons/md";

interface ErrorPageProps {
  type?: "403" | "404";
}

const Error = ({ type = "404" }: ErrorPageProps) => {
  const navigate = useNavigate();
  const is403 = type === "403";

  return (
    <Center h="100vh" bg="bg.canvas" p={4}>
      <Box
        maxW="md"
        w="full"
        textAlign="center"
        p={10}
        bg="white"
        shadow="2xl"
        borderRadius="3xl"
        borderWidth="1px"
      >
        <VStack gap={6}>
          <Center
            bg={is403 ? "red.50" : "brand.50"}
            w="80px"
            h="80px"
            borderRadius="full"
            color={is403 ? "red.500" : "brand.500"}
          >
            {is403 ? (
              <MdLockOutline size="40px" />
            ) : (
              <MdErrorOutline size="40px" />
            )}
          </Center>

          <VStack gap={2}>
            <Heading size="3xl" color={is403 ? "red.600" : "brand.600"}>
              {is403 ? "403" : "404"}
            </Heading>
            <Heading size="lg" letterSpacing="tight">
              {is403 ? "Access Denied" : "Page Not Found"}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              {is403
                ? "You don't have the necessary permissions to access this page. Please contact your administrator if you believe this is an error."
                : "Oops! You've landed in the wrong place. The page you are looking for doesn't exist or has been moved."}
            </Text>
          </VStack>

          <VStack w="full" gap={3}>
            <Button asChild colorPalette="brand" w="full" size="lg">
              <Link to="/">Go to Dashboard</Link>
            </Button>
            <Button variant="ghost" w="full" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </VStack>
        </VStack>
      </Box>
    </Center>
  );
};

export default Error;
