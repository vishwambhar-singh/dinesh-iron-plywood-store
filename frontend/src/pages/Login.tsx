import {
  Box,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  IconButton,
  InputGroup,
  Center,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff, MdLockOutline } from "react-icons/md";
import { useLoginMutation } from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { setAuth } from "@/store/authSlice";
import { useDispatch } from "react-redux";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await login({ email, password }).unwrap();

      dispatch(setAuth({ user: response.user, token: response.token }));

      toast.success(`Welcome, ${response.user.name}`);
      navigate("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Login failed");
    }
  };

  return (
    <Center minH="100vh" bg="bg.canvas" p={4}>
      <Box
        w="full"
        maxW="md"
        p={8}
        bg="white"
        shadow="xl"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="brand.100"
      >
        <Stack gap={6}>
          <Stack align="center" gap={2}>
            <Box bg="brand.50" p={3} borderRadius="full" color="brand.600">
              <MdLockOutline size="32px" />
            </Box>
            <Heading size="xl" color="brand.800" textAlign="center">
              Inventory System
            </Heading>
            <Text color="fg.muted">Sign in to manage your operations</Text>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Email Address</Field.Label>
                <Input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <InputGroup
                  flex="1"
                  endElement={
                    <IconButton
                      type="button"
                      aria-label="Toggle Password Visibility"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword(!showPassword);
                      }}
                      disabled={isLoading}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  }
                >
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                size="lg"
                loading={isLoading}
                mt={2}
              >
                Login
              </Button>
            </Stack>
          </form>

          <Text fontSize="xs" textAlign="center" color="fg.subtle">
            &copy; {new Date().getFullYear()} Inventory Management System
          </Text>
        </Stack>
      </Box>
    </Center>
  );
};

export default LoginPage;
