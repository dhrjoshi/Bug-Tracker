import React from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  VStack,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  useDisclosure,
  HStack,
  Spacer,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";

const LinkItem = ({ to, label, onClick }) => (
  <Box
    as={NavLink}
    to={to}
    onClick={onClick}
    px={4}
    py={3}
    rounded="md"
    _hover={{ bg: "gray.100" }}
    style={({ isActive }) => ({
      background: isActive ? "#EDF2F7" : "transparent",
      fontWeight: isActive ? 600 : 500,
      width: "100%",
      display: "block",
    })}
  >
    <Text>{label}</Text>
  </Box>
);

export default function Sidebar() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const NavLinks = ({ onItemClick }) => (
    <VStack align="stretch" spacing={2}>
      <LinkItem to="/log-bug" label="Log Bug" onClick={onItemClick} />
      <LinkItem to="/view-bugs" label="View Bugs" onClick={onItemClick} />
      <LinkItem to="/analytics" label="Bug Analytics" onClick={onItemClick} />
    </VStack>
  );

  return (
    <>
      {/* ✅ Mobile top bar with hamburger (top-right) */}
      <Box
        display={{ base: "block", md: "none" }}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={3}
        py={2}
        position="sticky"
        top="0"
        zIndex="10"
      >
        <HStack>
          <Text fontWeight="700">Bug Tracker</Text>
          <Spacer />
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="outline"
            onClick={onOpen}
          />
        </HStack>
      </Box>

      {/* ✅ Desktop sidebar */}
      <Box
        display={{ base: "none", md: "block" }}
        w="260px"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.200"
        p={4}
        minH="100vh"
      >
        <NavLinks />
      </Box>

      {/* ✅ Mobile Drawer sidebar */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <NavLinks onItemClick={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
