import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  HStack,
  Button,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  Flex,
} from "@chakra-ui/react";
import { FiTrash2, FiFilter } from "react-icons/fi";

const ProgressStages = [
  "Not Started",
  "In Development",
  "In Code Review",
  "In QA",
  "Ready for Release",
  "Live",
];

const Severities = ["Critical", "High", "Medium", "Low", "Trivial"];

const badgeColorForSeverity = (sev) => {
  switch (sev) {
    case "Critical":
      return "red";
    case "High":
      return "orange";
    case "Medium":
      return "yellow";
    case "Low":
      return "blue";
    case "Trivial":
      return "gray";
    default:
      return "gray";
  }
};

const badgeColorForProgress = (p) => {
  switch (p) {
    case "Not Started":
      return "gray";
    case "In Development":
      return "blue";
    case "In Code Review":
      return "purple";
    case "In QA":
      return "orange";
    case "Ready for Release":
      return "teal";
    case "Live":
      return "green";
    default:
      return "gray";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ---- Date filter helpers ----
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeekMonday() {
  const d = startOfToday();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}
function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}
function daysAgo(n) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}
const base_url = import.meta.env.VITE_BASE_URL;
export default function ViewBugsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);

  // Details modal
  const [selectedBug, setSelectedBug] = useState(null);

  // Edit progress modal
  const [editBug, setEditBug] = useState(null);
  const [newProgress, setNewProgress] = useState("Not Started");
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [deleteBug, setDeleteBug] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ Filters
  const [selectedProgress, setSelectedProgress] = useState([]); // multi
  const [selectedSeverity, setSelectedSeverity] = useState([]); // multi
  const [dateRange, setDateRange] = useState("ALL"); // single
  const [selectedReporter, setSelectedReporter] = useState("ALL"); // single

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}getAll/bugs`);
      setBugs(res?.data?.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || err.message || "Failed to load bugs",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueReporters = useMemo(() => {
    const set = new Set();
    for (const b of bugs) {
      if (b?.reporterName) set.add(b.reporterName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bugs]);

  const toggleMulti = (value, arrSetter) => {
    arrSetter((prev) => {
      if (prev.includes(value)) return prev.filter((x) => x !== value);
      return [...prev, value];
    });
  };

  const clearFilters = () => {
    setSelectedProgress([]);
    setSelectedSeverity([]);
    setDateRange("ALL");
    setSelectedReporter("ALL");
  };

  const filteredBugs = useMemo(() => {
    const now = new Date();
    const start =
      dateRange === "THIS_WEEK"
        ? startOfWeekMonday()
        : dateRange === "LAST_2_WEEKS"
        ? daysAgo(13) // includes today => ~14 days window
        : dateRange === "THIS_MONTH"
        ? startOfMonth()
        : null;

    return bugs.filter((b) => {
      // 1) Progress multi-filter
      if (selectedProgress.length > 0 && !selectedProgress.includes(b.progress))
        return false;

      // 2) Severity multi-filter
      if (selectedSeverity.length > 0 && !selectedSeverity.includes(b.severity))
        return false;

      // 3) Reporter single filter
      if (selectedReporter !== "ALL" && b.reporterName !== selectedReporter)
        return false;

      // 4) Date range filter (based on dateReported)
      if (start) {
        const d = new Date(b.dateReported);
        if (Number.isNaN(d.getTime())) return false;
        // keep between start..now
        if (d < start || d > now) return false;
      }

      return true;
    });
  }, [bugs, selectedProgress, selectedSeverity, dateRange, selectedReporter]);

  const totalCount = useMemo(() => filteredBugs.length, [filteredBugs]);

  const openEdit = (bug) => {
    setEditBug(bug);
    setNewProgress(bug.progress || "Not Started");
  };

  const updateProgress = async () => {
    if (!editBug?._id) return;

    if (!ProgressStages.includes(newProgress)) {
      toast({ title: "Invalid progress", status: "error" });
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${base_url}patch/bug-progress/${editBug._id}`,
        { progress: newProgress }
      );

      toast({
        title: "Updated",
        description: "Bug progress updated successfully",
        status: "success",
      });

      setEditBug(null);
      await fetchBugs();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to update progress",
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (bug) => setDeleteBug(bug);

  const handleDelete = async () => {
    if (!deleteBug?._id) return;

    try {
      setDeleting(true);
      await axios.delete(`${base_url}delete/bug/${deleteBug._id}`);

      toast({
        title: "Deleted",
        description: "Bug deleted successfully",
        status: "success",
      });

      setDeleteBug(null);
      await fetchBugs();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to delete bug",
        status: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const filterSummary = useMemo(() => {
    const parts = [];
    if (selectedProgress.length) parts.push(`Progress: ${selectedProgress.length}`);
    if (selectedSeverity.length) parts.push(`Severity: ${selectedSeverity.length}`);
    if (dateRange !== "ALL") parts.push(`Date: ${dateRange}`);
    if (selectedReporter !== "ALL") parts.push(`Reporter: 1`);
    return parts.length ? parts.join(" • ") : "No filters";
  }, [selectedProgress, selectedSeverity, dateRange, selectedReporter]);

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Box>
          <Heading size="md">View Bugs</Heading>
          <Text color="gray.600" fontSize="sm">
            Showing: {totalCount} bugs • {filterSummary}
          </Text>
        </Box>

        <HStack>
          <Button onClick={clearFilters} variant="ghost">
            Clear Filters
          </Button>
          <Button
            onClick={fetchBugs}
            isLoading={loading}
            colorScheme="blue"
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* ✅ Filter Bar */}
      <Flex
        gap={3}
        wrap="wrap"
        align="center"
        bg="white"
        borderWidth="1px"
        rounded="lg"
        p={3}
        mb={4}
      >
        {/* Progress multi */}
        <Menu closeOnSelect={false}> 
          <MenuButton as={Button} leftIcon={<FiFilter />} variant="outline" mt={6}>
            Progress {selectedProgress.length ? `(${selectedProgress.length})` : ""}
          </MenuButton>
          <MenuList maxH="300px" overflowY="auto">
            {ProgressStages.map((p) => (
              <MenuItem key={p} onClick={() => toggleMulti(p, setSelectedProgress)}>
                <Checkbox isChecked={selectedProgress.includes(p)} pointerEvents="none">
                  {p}
                </Checkbox>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Severity multi */}
        <Menu closeOnSelect={false}>
          <MenuButton as={Button} leftIcon={<FiFilter />} variant="outline" mt={6}>
            Severity {selectedSeverity.length ? `(${selectedSeverity.length})` : ""}
          </MenuButton>
          <MenuList maxH="300px" overflowY="auto">
            {Severities.map((s) => (
              <MenuItem key={s} onClick={() => toggleMulti(s, setSelectedSeverity)}>
                <Checkbox isChecked={selectedSeverity.includes(s)} pointerEvents="none">
                  {s}
                </Checkbox>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Date range single */}
        <FormControl maxW="220px">
          <FormLabel fontSize="sm" mb={1}>
            Date Reported
          </FormLabel>
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="THIS_WEEK">This Week</option>
            <option value="LAST_2_WEEKS">Last 2 Weeks</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="ALL">All time</option>
          </Select>
        </FormControl>

        {/* Reporter dropdown */}
        <FormControl maxW="260px">
          <FormLabel fontSize="sm" mb={1}>
            Reporter Name
          </FormLabel>
          <Select
            value={selectedReporter}
            onChange={(e) => setSelectedReporter(e.target.value)}
          >
            <option value="ALL">All reporters</option>
            {uniqueReporters.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormControl>
      </Flex>

      {/* Table */}
<Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
  {loading ? (
    <HStack p={6} spacing={3}>
      <Spinner />
      <Text>Loading bugs...</Text>
    </HStack>
  ) : filteredBugs.length === 0 ? (
    <Box p={6}>
      <Text color="gray.600">No bugs match the selected filters.</Text>
    </Box>
  ) : (
    // ✅ THIS makes it scroll instead of cropping
    <Box overflowX="auto" w="100%">
      <Table size="md" minW="980px">
        <Thead bg="gray.50">
          <Tr>
            <Th>Title</Th>
            <Th>Severity</Th>
            <Th>Progress</Th>
            <Th>Reporter</Th>
            <Th isNumeric>Est. Hours</Th>
            <Th>Reported At</Th>
            <Th textAlign="right">Actions</Th>
          </Tr>
        </Thead>

        <Tbody>
          {filteredBugs.map((bug) => (
            <Tr key={bug._id}>
              <Td maxW="360px">
                <Text fontWeight="600" noOfLines={1}>
                  {bug.title}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  ID: {bug._id}
                </Text>
              </Td>

              <Td>
                <Badge colorScheme={badgeColorForSeverity(bug.severity)}>
                  {bug.severity}
                </Badge>
              </Td>

              <Td>
                <Badge colorScheme={badgeColorForProgress(bug.progress)}>
                  {bug.progress}
                </Badge>
              </Td>

              <Td>{bug.reporterName}</Td>
              <Td isNumeric>{bug.estimatedFixHours}</Td>
              <Td>{formatDateTime(bug.reportedAt)}</Td>

              <Td>
                <HStack justify="flex-end">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedBug(bug)}>
                    View
                  </Button>

                  <Button size="sm" colorScheme="blue" onClick={() => openEdit(bug)}>
                    Edit Progress
                  </Button>

                  <IconButton
                    size="sm"
                    aria-label="Delete bug"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => confirmDelete(bug)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )}
</Box>


      {/* -------- View Details Modal -------- */}
      <Modal isOpen={!!selectedBug} onClose={() => setSelectedBug(null)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bug Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBug && (
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Title</Text>
                  <Text fontWeight="600">{selectedBug.title}</Text>
                </Box>

                <HStack spacing={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Severity</Text>
                    <Badge colorScheme={badgeColorForSeverity(selectedBug.severity)}>
                      {selectedBug.severity}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.500">Progress</Text>
                    <Badge colorScheme={badgeColorForProgress(selectedBug.progress)}>
                      {selectedBug.progress}
                    </Badge>
                  </Box>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.500">Reporter</Text>
                    <Text>{selectedBug.reporterName}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Estimated Fix Hours</Text>
                    <Text>{selectedBug.estimatedFixHours}</Text>
                  </Box>
                </HStack>

                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.500">Reported At</Text>
                    <Text>{formatDateTime(selectedBug.reportedAt)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Created At</Text>
                    <Text>{formatDateTime(selectedBug.createdAt)}</Text>
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" color="gray.500">Progress History</Text>
                  {selectedBug.progressHistory?.length ? (
                    <Box mt={2} borderWidth="1px" rounded="md" overflow="hidden">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Stage</Th>
                            <Th>Date & Time</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedBug.progressHistory.map((h, idx) => (
                            <Tr key={idx}>
                              <Td>{h.stage}</Td>
                              <Td>{formatDateTime(h.at)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Text color="gray.600" mt={1}>No history available.</Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setSelectedBug(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* -------- Edit Progress Modal -------- */}
      <Modal isOpen={!!editBug} onClose={() => setEditBug(null)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Bug Progress</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editBug && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.500">Bug</Text>
                  <Text fontWeight="600" noOfLines={2}>{editBug.title}</Text>
                </Box>

                <FormControl isRequired>
                  <FormLabel>Progress</FormLabel>
                  <Select value={newProgress} onChange={(e) => setNewProgress(e.target.value)}>
                    {ProgressStages.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setEditBug(null)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={updateProgress}
              isLoading={saving}
              loadingText="Saving..."
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* -------- Delete Confirm Modal -------- */}
      <Modal isOpen={!!deleteBug} onClose={() => setDeleteBug(null)} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Bug</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {deleteBug && (
              <>
                <Text>Are you sure you want to delete this bug?</Text>
                <Text mt={2} fontWeight="600">{deleteBug.title}</Text>
                <Text mt={1} fontSize="sm" color="gray.500">
                  This action cannot be undone.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setDeleteBug(null)}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={deleting}
              loadingText="Deleting..."
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
