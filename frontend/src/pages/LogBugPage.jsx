import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  VStack,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";

const ProgressStages = [
  "Not Started",
  "In Development",
  "In Code Review",
  "In QA",
  "Ready for Release",
  "Live",
];

const Severities = ["Critical", "High", "Medium", "Low", "Trivial"];

export default function LogBugPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    severity: "Critical",
    progress: "Not Started",
    reporterName: "",
    estimatedFixHours: 1,
    dateReported: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onHoursChange = (valueStr) => {
    // Chakra NumberInput gives value as string
    const num = Number(valueStr);
    setForm((prev) => ({
      ...prev,
      estimatedFixHours: Number.isFinite(num) ? num : 0,
    }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Bug title is required.";
    if (!form.reporterName.trim()) return "Reporter name is required.";
    if (!Severities.includes(form.severity)) return "Invalid severity selected.";
    if (!ProgressStages.includes(form.progress)) return "Invalid progress selected.";
    if (form.estimatedFixHours < 0) return "Estimated fix hours must be >= 0.";
    if (!form.dateReported) return "Date reported is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast({ title: "Validation error", description: err, status: "error" });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        severity: form.severity,
        progress: form.progress,
        reporterName: form.reporterName.trim(),
        estimatedFixHours: form.estimatedFixHours,
        dateReported: form.dateReported, // backend can convert to Date
      };
      // const base_url = import.meta.env.VITE_BASE_URL;
      const base_url = 'http://localhost:4000/api/';
      const res = await axios.post(`${base_url}create/bug`, payload);

      toast({
        title: "Bug logged",
        description: res?.data?.message || "Bug created successfully.",
        status: "success",
      });

      // reset form (keep defaults)
      setForm({
        title: "",
        severity: "Critical",
        progress: "Not Started",
        reporterName: "",
        estimatedFixHours: 1,
        dateReported: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create bug";
      toast({ title: "Error", description: msg, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="900px">
      <Heading size="md" mb={4}>
        Log Bug
      </Heading>

      <Box as="form" onSubmit={handleSubmit} bg="white" p={6} rounded="lg" borderWidth="1px">
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Bug Title</FormLabel>
            <Input
              placeholder="e.g. Payment gateway crashes on checkout"
              value={form.title}
              onChange={onChange("title")}
            />
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Severity</FormLabel>
              <Select value={form.severity} onChange={onChange("severity")}>
                {Severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Bug Progress</FormLabel>
              <Select value={form.progress} onChange={onChange("progress")}>
                {ProgressStages.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Reporter Name</FormLabel>
              <Input
                placeholder="e.g. QA Team"
                value={form.reporterName}
                onChange={onChange("reporterName")}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Estimated Fix Time (Hours)</FormLabel>
              <NumberInput
                min={0}
                value={form.estimatedFixHours}
                onChange={onHoursChange}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired>
            <FormLabel>Date Reported</FormLabel>
            <Input
              type="date"
              value={form.dateReported}
              onChange={onChange("dateReported")}
            />
          </FormControl>

          <Button
            type="submit"
            isLoading={loading}
            loadingText="Submitting..."
            colorScheme="blue"
            alignSelf="flex-start"
          >
            Submit Bug
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
