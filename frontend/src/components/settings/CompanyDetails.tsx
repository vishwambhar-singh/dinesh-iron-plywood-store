import { useState, useRef, useEffect } from "react";
import {
  Box,
  Heading,
  Field,
  Input,
  HStack,
  Flex,
  Stack,
  VStack,
  Circle,
  Image,
  Text,
  Grid,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  MdOutlineBusiness,
  MdSave,
  MdEdit,
  MdPhotoCamera,
  MdClose,
} from "react-icons/md";
import { toast } from "@/utils/toast";
import { useGetCompanyQuery, useUpdateCompanyMutation } from "@/store/apiSlice";

export const CompanyDetails = () => {
  const { data: company, isLoading } = useGetCompanyQuery();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (company) {
      setDetails({
        name: company.name || "",
        email: company.email || "",
        mobile: company.mobile || "",
        address: company.address || "",
        gstNumber: company.gstNumber || "",
        panNumber: company.panNumber || "",
        logoUrl: company.logoUrl || "",
      });
    }
  }, [company]);

  const handleAction = async () => {
    if (isEditing) {
      try {
        await updateCompany(details).unwrap();
        setIsEditing(false);
        toast.success("Details Updated!");
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to Update!");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "HMS_PRESET");

    try {
      setIsUploading(true);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dmswrbcdm/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.secure_url) {
        setDetails((prev) => ({ ...prev, logoUrl: data.secure_url }));
        toast.success("Logo Uploaded!");
      }
    } catch (error) {
      toast.error("Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);

    if (company) {
      setDetails({
        name: company.name || "",
        email: company.email || "",
        mobile: company.mobile || "",
        address: company.address || "",
        gstNumber: company.gstNumber || "",
        panNumber: company.panNumber || "",
        logoUrl: company.logoUrl || "",
      });
    }
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="xl"
      bg="bgMain"
      width="full"
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleLogoChange}
      />

      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Box color="brandPrimary">
            <MdOutlineBusiness size={24} />
          </Box>
          <Heading size="md" color="brandPrimary">
            Company Details
          </Heading>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "150px 1fr" }} gap={8}>
        <VStack align="center" gap={4}>
          <Box position="relative">
            <Circle
              size="100px"
              overflow="hidden"
              borderWidth="2px"
              borderColor="gray.200"
              bg="gray.50"
            >
              <Image src={details.logoUrl} alt="Logo" objectFit="cover" />
            </Circle>
            {isEditing && (
              <Circle
                size="32px"
                bg="brand.500"
                color="white"
                position="absolute"
                bottom="0"
                right="0"
                cursor="pointer"
                shadow="sm"
                onClick={() => fileInputRef.current?.click()}
                _hover={{ bg: "brand.600" }}
              >
                <MdPhotoCamera size={18} />
              </Circle>
            )}
          </Box>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Company Logo
          </Text>
        </VStack>

        <Stack gap={4}>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                Company Name
              </Field.Label>
              <Input
                disabled={!isEditing}
                value={details.name}
                onChange={(e) =>
                  setDetails({ ...details, name: e.target.value })
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                Email Address
              </Field.Label>
              <Input
                type="email"
                disabled={!isEditing}
                value={details.email}
                onChange={(e) =>
                  setDetails({ ...details, email: e.target.value })
                }
              />
            </Field.Root>
          </Grid>

          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                Mobile Number
              </Field.Label>
              <Input
                disabled={!isEditing}
                value={details.mobile}
                onChange={(e) =>
                  setDetails({ ...details, mobile: e.target.value })
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                Address
              </Field.Label>
              <Input
                disabled={!isEditing}
                value={details.address}
                onChange={(e) =>
                  setDetails({ ...details, address: e.target.value })
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                GST Number
              </Field.Label>
              <Input
                disabled={!isEditing}
                value={details.gstNumber}
                onChange={(e) =>
                  setDetails({ ...details, gstNumber: e.target.value })
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontWeight="bold" fontSize="sm">
                PAN Number
              </Field.Label>
              <Input
                disabled={!isEditing}
                value={details.panNumber}
                onChange={(e) =>
                  setDetails({ ...details, panNumber: e.target.value })
                }
              />
            </Field.Root>
          </Grid>
        </Stack>
      </Grid>

      <Flex justify="flex-end" mt={8} gap={3}>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <MdClose /> Cancel
          </Button>
        )}
        <Button
          size="sm"
          loading={isUpdating || isUploading}
          variant={isEditing ? "solid" : "outline"}
          colorPalette="brand"
          onClick={handleAction}
          gap={2}
        >
          {isEditing ? (
            <>
              <MdSave /> Save Changes
            </>
          ) : (
            <>
              <MdEdit /> Edit Details
            </>
          )}
        </Button>
      </Flex>
    </Box>
  );
};
