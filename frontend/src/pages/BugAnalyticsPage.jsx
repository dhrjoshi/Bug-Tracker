import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  HStack,
  useToast,
} from "@chakra-ui/react";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";

const Severities = ["Critical", "High", "Medium", "Low", "Trivial"];

const severityColors = {
  Critical: "#E53E3E",
  High: "#DD6B20",
  Medium: "#D69E2E",
  Low: "#3182CE",
  Trivial: "#718096",
};

const progressColors = {
  "Not Started": "#A0AEC0",
  "In Development": "#3182CE",
  "In Code Review": "#805AD5",
  "In QA": "#DD6B20",
  "Ready for Release": "#319795",
  Live: "#38A169",
};

// Monday week start (YYYY-MM-DD)
function getWeekStartYYYYMMDD(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day; // shift to Monday
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() + diffToMonday);

  return monday.toISOString().slice(0, 10);
}

export default function BugAnalyticsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState(null);
  const [bugs, setBugs] = useState([]);
  // const base_url = import.meta.env.VITE_BASE_URL;
  const base_url = 'http://localhost:4000/api/';

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [aRes, bRes] = await Promise.all([
        axios.get(`${base_url}getBug/analytics`),
        axios.get(`${base_url}getAll/bugs`),
      ]);

      setAnalytics(aRes?.data?.data || null);
      setBugs(bRes?.data?.data || []);
    } catch (err) {
      toast({
        title: "Failed to load analytics",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Charts data ----
  const progressPieData = useMemo(() => {
    const arr = analytics?.bugsByProgress || [];
    return arr.map((x) => ({ name: x.stage, value: x.count }));
  }, [analytics]);

  const funnelData = useMemo(() => {
    const arr = analytics?.funnelByProgress || [];
    return arr.map((x) => ({ name: x.stage, value: x.count }));
  }, [analytics]);

  // Weekly stacked bar (weekStart on X, counts by severity as keys)
  const weeklySeverityData = useMemo(() => {
    if (!bugs?.length) return [];

    const map = new Map(); // weekStart -> { weekStart, Critical:0,... }

    for (const bug of bugs) {
      const wk = getWeekStartYYYYMMDD(bug.dateReported);
      if (!wk) continue;

      if (!map.has(wk)) {
        const base = { weekStart: wk };
        for (const s of Severities) base[s] = 0;
        map.set(wk, base);
      }

      const rec = map.get(wk);
      const sev = bug.severity;
      if (Severities.includes(sev)) rec[sev] += 1;
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.weekStart) - new Date(b.weekStart)
    );
  }, [bugs]);

  const avgHours = analytics?.avgDevToLiveHours;
  const sample = analytics?.avgDevToLiveSampleSize ?? 0;

  return (
    <Box>
      <Heading size="md" mb={2}>
        Bug Analytics
      </Heading>
      <Text color="gray.600" mb={6}>
        Progress distribution, weekly severity trend, Dev → Live average time, and funnel by stage.
      </Text>

      {loading ? (
        <HStack spacing={3}>
          <Spinner />
          <Text>Loading analytics...</Text>
        </HStack>
      ) : (
        <>
          {/* KPI Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Box bg="white" borderWidth="1px" rounded="lg" p={4}>
              <Stat>
                <StatLabel>Avg time: In Development → Live</StatLabel>
                <StatNumber>
                  {avgHours == null ? "-" : `${avgHours.toFixed(1)} hrs`}
                </StatNumber>
                <StatHelpText>Based on {sample} bugs</StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" borderWidth="1px" rounded="lg" p={4}>
              <Stat>
                <StatLabel>Total Bugs</StatLabel>
                <StatNumber>{bugs.length}</StatNumber>
                <StatHelpText>From /api/getAll/bugs</StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" borderWidth="1px" rounded="lg" p={4}>
              <Stat>
                <StatLabel>Progress Stages</StatLabel>
                <StatNumber>{analytics?.bugsByProgress?.length || 0}</StatNumber>
                <StatHelpText>Tracked stages</StatHelpText>
              </Stat>
            </Box>
          </SimpleGrid>

          {/* Charts */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Pie: progress distribution */}
            <Box bg="white" borderWidth="1px" rounded="lg" p={4} h="360px">
              <Text fontWeight="600" mb={2}>
                Bugs by Progress (Pie)
              </Text>

              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={progressPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {progressPieData.map((entry, index) => (
                      <Cell
                        key={`p-${index}`}
                        fill={progressColors[entry.name] || "#CBD5E0"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Funnel: progress stages */}
            <Box bg="white" borderWidth="1px" rounded="lg" p={4} h="360px">
              <Text fontWeight="600" mb={2}>
                Funnel: Bugs by Progress Stage
              </Text>

              <ResponsiveContainer width="100%" height="90%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                    {funnelData.map((entry, index) => (
                      <Cell
                        key={`f-${index}`}
                        fill={progressColors[entry.name] || "#CBD5E0"}
                      />
                    ))}
                    <LabelList position="right" dataKey="name" />
                    <LabelList position="inside" dataKey="value" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </Box>

            {/* Stacked bar: weekly by severity */}
            <Box
              bg="white"
              borderWidth="1px"
              rounded="lg"
              p={4}
              h="420px"
              gridColumn={{ base: "auto", lg: "1 / -1" }}
            >
              <Text fontWeight="600" mb={2}>
                Weekly Bug Count (Stacked by Severity)
              </Text>

              {weeklySeverityData.length === 0 ? (
                <Text color="gray.600">
                  Not enough data to build weekly chart yet.
                </Text>
              ) : (
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={weeklySeverityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekStart" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />

                    {Severities.map((s) => (
                      <Bar
                        key={s}
                        dataKey={s}
                        stackId="sev"
                        fill={severityColors[s]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
