import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getAccounts, getProfile, logout } from "../../src/lib/api";

const CYAN  = "#46C2E9";
const BG    = "#0A0C10";
const PANEL = "#11141B";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardScreen() {
  const [accounts, setAccounts]   = useState<any[]>([]);
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const [profileData, accountData] = await Promise.all([getProfile(), getAccounts()]);
      setEmail(profileData.email);
      setAccounts(accountData.accounts ?? []);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const cash       = accounts.filter(a => a.type === "depository");
  const credit     = accounts.filter(a => a.type === "credit");
  const investment = accounts.filter(a => a.type === "investment");
  const totalCash  = cash.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalCredit = credit.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalInv   = investment.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const netWorth   = totalCash + totalInv - totalCredit;

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={CYAN} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={CYAN}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Worth<Text style={{ color: CYAN }}>IQ</Text></Text>
            <Text style={styles.headerSub}>Financial Intelligence</Text>
          </View>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Net worth */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>NET WORTH</Text>
          <Text style={[styles.netWorthValue, { color: netWorth >= 0 ? "#fff" : "#ef4444" }]}>
            {fmt(netWorth)}
          </Text>
        </View>

        {/* Summary tiles */}
        <View style={styles.tileRow}>
          <SummaryTile label="Cash" value={fmt(totalCash)} color="#4ade80" />
          <SummaryTile label="Credit" value={fmt(totalCredit)} color="#f87171" />
          <SummaryTile label="Invested" value={fmt(totalInv)} color="#c084fc" />
        </View>

        {/* Account list */}
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No accounts connected</Text>
            <Text style={styles.emptySub}>Link your bank to get started</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={() => router.push("/(app)/connect")}>
              <Text style={styles.connectBtnText}>Connect Bank</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ACCOUNTS</Text>
            {accounts.map((acc, i) => (
              <View key={acc.account_id ?? i} style={styles.accountCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountSub}>{acc.institution ?? acc.subtype} •••• {acc.mask}</Text>
                </View>
                <Text style={styles.accountBalance}>
                  {fmt(acc.balances.current ?? 0)}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: BG },
  scroll:          { padding: 20, paddingBottom: 40 },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  logoText:        { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  headerSub:       { fontSize: 10, fontWeight: "700", color: CYAN, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 },
  emailText:       { fontSize: 11, color: "#475569", maxWidth: 140, textAlign: "right" },
  netWorthCard:    { backgroundColor: PANEL, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "#1e293b" },
  netWorthLabel:   { fontSize: 10, fontWeight: "700", color: "#475569", letterSpacing: 2, marginBottom: 6 },
  netWorthValue:   { fontSize: 40, fontWeight: "900" },
  tileRow:         { flexDirection: "row", gap: 10, marginBottom: 24 },
  tile:            { flex: 1, backgroundColor: PANEL, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1e293b" },
  tileLabel:       { fontSize: 9, fontWeight: "700", color: "#475569", letterSpacing: 1.5, marginBottom: 4 },
  tileValue:       { fontSize: 15, fontWeight: "800" },
  sectionLabel:    { fontSize: 10, fontWeight: "700", color: "#475569", letterSpacing: 2, marginBottom: 12 },
  accountCard:     { flexDirection: "row", alignItems: "center", backgroundColor: PANEL, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#1e293b" },
  accountName:     { fontSize: 14, fontWeight: "700", color: "#fff" },
  accountSub:      { fontSize: 11, color: "#475569", marginTop: 2 },
  accountBalance:  { fontSize: 16, fontWeight: "800", color: "#fff", fontVariant: ["tabular-nums"] },
  emptyState:      { alignItems: "center", paddingVertical: 60 },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 6 },
  emptySub:        { fontSize: 13, color: "#475569", marginBottom: 24 },
  connectBtn:      { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  connectBtnText:  { fontSize: 14, fontWeight: "800", color: "#000" },
});
