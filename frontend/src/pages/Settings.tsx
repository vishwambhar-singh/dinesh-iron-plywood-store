import {
  Box,
  Heading,
  Text,
  VStack,
  Tabs,
  Badge,
  HStack,
  Icon,
  Flex,
} from "@chakra-ui/react";
import ProfileSettings from "@/components/settings/ProfileSettings";
import { InventorySettings } from "@/components/settings/InventorySettings";
import { TermsSettings } from "@/components/settings/TermsSettings";
import { CompanyDetails } from "@/components/settings/CompanyDetails";
import { DummyDetails } from "@/components/settings/DummyDetails";
import { ChangePassword } from "@/components/settings/ChangePassword";
import RolePermissionsSetting from "@/components/settings/RolePermissionsSetting";
import { ExportSettings } from "@/components/settings/ExportSettings";
import { DatabaseBackup } from "@/components/settings/DatabaseBackup";
import {
  MdPerson,
  MdBusiness,
  MdInventory,
  MdSettings,
  MdDescription,
} from "react-icons/md";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { CustomSpinner } from "@/components/ui/CustomSpinner";
import { ReferralSettings } from "@/components/settings/ReferralSettings";
import { useAuth } from "@/hooks/useAuth";
import { CreditTermSettings } from "@/components/settings/CreditTermSettings";
import { BankSettings } from "@/components/settings/BankSettings";
import { PriceInflationSettings } from "@/components/settings/PriceInflationSettings";

const Settings = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { data: allSettings, isLoading } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  const handleUpdate = async (payload: any) => {
    try {
      await updateSettings(payload).unwrap();
      toast.success("Settings updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (isLoading) return <CustomSpinner message="Fetching settings" />;

  return (
    <Box width="full" minH="100vh" bg="bg.canvas" p={{ base: 4, md: 8 }}>
      <Flex
        justify="space-between"
        align="center"
        bg="white"
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.100"
        shadow="sm"
        mb={8}
      >
        <HStack gap={4}>
          <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
            <Icon as={MdSettings} boxSize={6} />
          </Box>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Heading
                size="lg"
                letterSpacing="tight"
                color="brand.900"
                lineHeight="short"
              >
                Settings
              </Heading>
              <Badge
                colorPalette="brand"
                variant="subtle"
                size="sm"
                borderRadius="md"
              >
                System
              </Badge>
            </HStack>
            <Text color="brand.500" fontSize="sm" fontWeight="medium">
              Manage your account, business details, and system preferences
            </Text>
          </Box>
        </HStack>
      </Flex>

      <Tabs.Root
        defaultValue="profile"
        variant="enclosed"
        width="full"
        colorPalette="brand"
      >
        <Tabs.List
          bg="white"
          p={1.5}
          borderRadius="xl"
          border="1px solid"
          borderColor="brand.100"
          width="full"
          justifyContent="space-between"
          shadow="sm"
        >
          <Tabs.Trigger
            value="profile"
            gap={2}
            borderRadius="lg"
            fontWeight="bold"
          >
            <MdPerson /> Profile
          </Tabs.Trigger>
          {(isSuperAdmin || isAdmin) && (
            <>
              <Tabs.Trigger
                value="company"
                gap={2}
                borderRadius="lg"
                fontWeight="bold"
              >
                <MdBusiness /> Company
              </Tabs.Trigger>
              <Tabs.Trigger
                value="inventory"
                gap={2}
                borderRadius="lg"
                fontWeight="bold"
              >
                <MdInventory /> Inventory
              </Tabs.Trigger>
              <Tabs.Trigger
                value="invoice"
                gap={2}
                borderRadius="lg"
                fontWeight="bold"
              >
                <MdDescription /> Invoice
              </Tabs.Trigger>
              <Tabs.Trigger
                value="system"
                gap={2}
                borderRadius="lg"
                fontWeight="bold"
              >
                <MdSettings /> System
              </Tabs.Trigger>
            </>
          )}
        </Tabs.List>

        <Box mt={8}>
          <Tabs.Content value="profile">
            <VStack gap={6} align="stretch">
              <ProfileSettings />
              <ChangePassword />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="company">
            <VStack gap={6} align="stretch">
              {(isSuperAdmin || isAdmin) && <CompanyDetails />}
              {isSuperAdmin && <DummyDetails />}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="inventory">
            <VStack gap={6} align="stretch">
              {(isSuperAdmin || isAdmin) && (
                <InventorySettings
                  initialThreshold={Number(allSettings?.min_threshold || 0)}
                  initialNotify={allSettings?.notification_enabled === "true"}
                  onSave={(data: any) => handleUpdate(data)}
                />
              )}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="system">
            <VStack gap={6} align="stretch">
              {(isSuperAdmin || isAdmin) && (
                <>
                  <RolePermissionsSetting />
                  <BankSettings
                    initialBanks={allSettings?.bank_list || "[]"}
                    onSave={handleUpdate}
                  />
                  <CreditTermSettings
                    initialSupplierDays={
                      allSettings?.supplier_credit_days || "0"
                    }
                    initialCustomerDays={
                      allSettings?.customer_credit_days || "0"
                    }
                    onSave={handleUpdate}
                  />
                  <ExportSettings
                    initialFormat={allSettings?.preferred_format || "xlsx"}
                    onSave={handleUpdate}
                  />
                  {isSuperAdmin && <DatabaseBackup />}
                  <ReferralSettings
                    initialPercent={allSettings?.referral_percent || "0"}
                    onSave={handleUpdate}
                  />
                  <PriceInflationSettings
                    initialPercent={allSettings?.inflation_percent || "0"}
                    onSave={handleUpdate}
                  />
                </>
              )}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="invoice">
            {(isSuperAdmin || isAdmin) && (
              <TermsSettings
                initialTerms={allSettings?.invoice_terms || ""}
                onSave={handleUpdate}
              />
            )}
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
};

export default Settings;
