import React from "react";
import { Flex, Heading, Box } from "@chakra-ui/react";

export default function Header() {
  return (
    <Box bg="white" borderBottom="1px solid" borderColor="gray.200">
      <Flex align="center" px={6} py={4}>
        <Heading
          size="md"
          fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont"
          fontWeight="600"
          letterSpacing="tight"
        >
          Bug Tracker
        </Heading>
      </Flex>
    </Box>
  );
}
