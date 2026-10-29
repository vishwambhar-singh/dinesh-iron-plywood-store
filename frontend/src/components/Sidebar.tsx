import { Box, VStack, Text, HStack, IconButton, Image } from "@chakra-ui/react";
import { MdInventory2, MdClose } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGetCompanyQuery } from "@/store/apiSlice";

const NavItem = ({ icon: IconComponent, children, to, onClick }: any) => {
  return (
    <NavLink
      to={to}
      style={{ textDecoration: "none", width: "100%" }}
      onClick={onClick}
    >
      {({ isActive }) => (
        <HStack
          p={3}
          mx={4}
          gap={4}
          borderRadius="md"
          bg={isActive ? "brand.100" : "transparent"}
          _hover={{ bg: isActive ? "brand.100" : "brand.50" }}
          _dark={{
            bg: isActive ? "brand.900" : "transparent",
            _hover: { bg: isActive ? "brand.900" : "whiteAlpha.50" },
          }}
          transition="0.2s"
        >
          <Box color={isActive ? "brand.600" : "brand.500"}>
            <IconComponent size={20} />
          </Box>
          <Text
            fontWeight={isActive ? "semibold" : "medium"}
            color={isActive ? "brand.800" : "brand.600"}
          >
            {children}
          </Text>
        </HStack>
      )}
    </NavLink>
  );
};

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { user, isSuperAdmin } = useAuth();
  const permissions = user?.permissions || [];
  const { data: companyData } = useGetCompanyQuery();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.to === "/" || item.to === "/settings") return true;
    if (isSuperAdmin) return true;
    return permissions.includes(item.to);
  });

  return (
    <Box
      w="full"
      h="full"
      bg="bg.panel"
      py={5}
      borderRight="1px solid"
      borderColor="border.subtle"
      overflowY="auto"
      height="90vh"
    >
      <HStack px={6} mb={10} justify="space-between">
        <HStack gap={3}>
          {companyData?.logo ? (
            <Image
              src={companyData?.logo_url}
              alt="Company Logo"
              width="40px"
              height="40px"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <Box bg="brand.600" p={2} borderRadius="lg">
              <MdInventory2 color="white" size={22} />
            </Box>
          )}
          <Text
            fontSize="xl"
            fontWeight="black"
            color="brand.900"
            letterSpacing="tight"
          >
            {companyData?.name || "Inventory"}
          </Text>
        </HStack>
        {onClose && (
          <IconButton
            variant="ghost"
            display={{ base: "flex", lg: "none" }}
            onClick={onClose}
          >
            <MdClose size={24} />
          </IconButton>
        )}
      </HStack>

      <VStack align="stretch" gap={1}>
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            to={item.to}
            onClick={onClose}
          >
            {item.label}
          </NavItem>
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar;
