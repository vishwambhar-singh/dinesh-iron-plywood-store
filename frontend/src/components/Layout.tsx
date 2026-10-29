import { Box, Flex, IconButton } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { MdMenu } from "react-icons/md";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerRoot,
} from "@/components/ui/drawer";
import { useNotifications } from "@/hooks/useNotification";

const Layout = () => {
  useNotifications();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Flex h="100vh" w="100vw" overflow="hidden" bg="bg.canvas">
      <Box
        display={{ base: "none", lg: "block" }}
        w="280px"
        h="full"
        flexShrink={0}
      >
        <Sidebar />
      </Box>

      <DrawerRoot
        open={isMobileMenuOpen}
        onOpenChange={(e) => setIsMobileMenuOpen(e.open)}
        placement="start"
      >
        <DrawerBackdrop />
        <DrawerContent bg="white" w="280px" h="full" p={0}>
          <DrawerBody p={0}>
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      <Flex flex="1" direction="column" overflow="hidden" position="relative">
        <Flex
          align="center"
          borderBottom="1px solid"
          borderColor="border.subtle"
          bg="bg.panel"
        >
          <IconButton
            display={{ base: "flex", lg: "none" }}
            aria-label="Open Menu"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(true)}
            m={2}
          >
            <MdMenu size={24} />
          </IconButton>
          <Box flex="1">
            <Navbar />
          </Box>
        </Flex>

        <Box
          as="main"
          flex="1"
          overflowY="auto"
          bg="gray.50"
          _dark={{ bg: "#021a19" }}
          p={{ base: 4, md: 8, lg: 10 }}
        >
          <Box maxW="1400px" mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
