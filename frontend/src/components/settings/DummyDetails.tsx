import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Field,
  Input,
  HStack,
  Flex,
  Text,
  Grid,
  Circle,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdOutlineBusiness, MdSave, MdEdit, MdClose } from "react-icons/md";
import { toast } from "@/utils/toast";
import {
  useGetDummyCompanyQuery,
  useUpdateDummyCompanyMutation,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";

export const DummyDetails = () => {
  const { isSuperAdmin } = useAuth();
  const { data: dummyCompany = [], isLoading } = useGetDummyCompanyQuery(
    undefined,
    {
      skip: !isSuperAdmin,
    },
  );
  const [updateDummyCompany, { isLoading: isUpdating }] =
    useUpdateDummyCompanyMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });

  useEffect(() => {
    if (dummyCompany) {
      setDetails({
        name: dummyCompany.name || "",
        email: dummyCompany.email || "",
        mobile: dummyCompany.mobile || "",
        address: dummyCompany.address || "",
      });
    }
  }, [dummyCompany]);

  const handleCancel = () => {
    if (dummyCompany) {
      setDetails({
        name: dummyCompany.name || "",
        email: dummyCompany.email || "",
        mobile: dummyCompany.mobile || "",
        address: dummyCompany.address || "",
      });
    }
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      try {
        await updateDummyCompany(details).unwrap();
        setIsEditing(false);
        toast.success("Details Updated!");
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to Update!");
      }
    } else {
      setIsEditing(true);
    }
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <Box
      p={{ base: 4, md: 8 }}
      borderWidth="1px"
      borderRadius="2xl"
      bg="bg.panel"
      shadow="sm"
      width="full"
    >
      <Flex mb={8} justify="space-between" align="center" wrap="wrap" gap={4}>
        <HStack gap={4}>
          <Circle size="12" bg="brand.muted" color="brand.solid">
            <MdOutlineBusiness size={24} />
          </Circle>
          <Box>
            <Heading size="md" letterSpacing="tight">
              Dummy Company Information
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Manage secondary business identity for invoices
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="gray"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <MdClose /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            loading={isUpdating}
            colorPalette={isEditing ? "brand" : "gray"}
            variant={isEditing ? "solid" : "outline"}
            onClick={handleAction}
            minW="120px"
          >
            {isEditing ? (
              <HStack gap={2}>
                <MdSave /> Save Changes
              </HStack>
            ) : (
              <HStack gap={2}>
                <MdEdit /> Edit Profile
              </HStack>
            )}
          </Button>
        </HStack>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
        gapX={12}
        gapY={6}
      >
        <Field.Root>
          <Field.Label fontWeight="semibold" mb={2} fontSize="sm">
            Company Name
          </Field.Label>
          <Input
            variant={isEditing ? "outline" : "subtle"}
            disabled={!isEditing}
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
            placeholder="e.g. Acme Corp"
            _disabled={{ opacity: 0.8, cursor: "not-allowed", bg: "bg.muted" }}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="semibold" mb={2} fontSize="sm">
            Email Address
          </Field.Label>
          <Input
            type="email"
            variant={isEditing ? "outline" : "subtle"}
            disabled={!isEditing}
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            placeholder="contact@company.com"
            _disabled={{ opacity: 0.8, cursor: "not-allowed", bg: "bg.muted" }}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="semibold" mb={2} fontSize="sm">
            Mobile Number
          </Field.Label>
          <Input
            variant={isEditing ? "outline" : "subtle"}
            disabled={!isEditing}
            value={details.mobile}
            onChange={(e) => setDetails({ ...details, mobile: e.target.value })}
            placeholder="+91 00000 00000"
            _disabled={{ opacity: 0.8, cursor: "not-allowed", bg: "bg.muted" }}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="semibold" mb={2} fontSize="sm">
            Office Address
          </Field.Label>
          <Input
            variant={isEditing ? "outline" : "subtle"}
            disabled={!isEditing}
            value={details.address}
            onChange={(e) =>
              setDetails({ ...details, address: e.target.value })
            }
            placeholder="Full office address"
            _disabled={{ opacity: 0.8, cursor: "not-allowed", bg: "bg.muted" }}
          />
        </Field.Root>
      </Grid>
    </Box>
  );
};
