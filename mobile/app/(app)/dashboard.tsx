import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  computeNetWorthFromAccounts,
  NW_DISPLAY_FORMAT_KEY,
  type NwDisplayFormat,
  formatNetWorthHeadline,
  fmtCurrencyWhole,
} from "@worthiq/core";
import { getAccounts, getProfile } from "../../src/lib/api";
import { theme, wordmarkIqTight } from "../../src/theme";

export default function DashboardScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nwFormat, setNwFormat] = useState<NwDisplayFormat>("compact");

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(NW_DISPLAY_FORMAT_KEY);
        if (v === "precise" || v === "compact") setNwFormat(v);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const persistFormat = useCallback(async (mode: NwDisplayFormat) => {
    setNwFormat(mode);
    try {
      await AsyncStorage.setItem(NW_DISPLAY_FORMAT_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

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

  useEffect(() => {
    load();
  }, []);

  const cash = accounts.filter((a) => a.type === "depository");
  const credit = accounts.filter((a) => a.type === "credit");
  const investment = accounts.filter((a) => a.type === "investment");
  const totalCash = cash.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalCredit = credit.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalInv = investment.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const netWorth = computeNetWorthFromAccounts(accounts);

  const toggleNwFormat = () => {
    void persistFormat(nwFormat === "compact" ? "precise" : "compact");
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={theme.cyan} size="large" />
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
            tintColor={theme.cyan}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>
              Worth<Text style={[wordmarkIqTight, { color: theme.cyan }]}>IQ</Text>
              <Text style={styles.tm}>™</Text>
            </Text>
            <Text style={styles.headerSub}>Financial Intelligence</Text>
          </View>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Net worth — same formula & format toggle as web (@worthiq/core) */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>NET WORTH</Text>
          <TouchableOpacity onPress={toggleNwFormat} activeOpacity={0.85} accessibilityRole="button">
            <Text
              style={[
                styles.netWorthValue,
                nwFormat === "precise" && styles.netWorthValuePrecise,
                { color: netWorth >= 0 ? theme.text : theme.danger },
              ]}
            >
              {formatNetWorthHeadline(netWorth, nwFormat)}
            </Text>
          </TouchableOpacity>
          <Text style={styles.netWorthHint}>
            Tap the amount for rounded ($K) vs exact cents — synced key with web ({NW_DISPLAY_FORMAT_KEY}).
          </Text>
        </View>

        {/* Summary tiles */}
        <View style={styles.tileRow}>
          <SummaryTile label="Cash" value={fmtCurrencyWhole(totalCash)} color={theme.green} />
          <SummaryTile label="Credit" value={fmtCurrencyWhole(totalCredit)} color={theme.red} />
          <SummaryTile label="Invested" value={fmtCurrencyWhole(totalInv)} color={theme.purple} />
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
                  <Text style={styles.accountSub}>
                    {acc.institution ?? acc.subtype} •••• {acc.mask}
                  </Text>
                </View>
                <Text style={styles.accountBalance}>
                  {fmtCurrencyWhole(acc.balances.current ?? 0)}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.coreHint}>
          Net worth uses @worthiq/core — edit packages/worthiq-core to change both apps.
        </Text>
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
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  logoText: { fontSize: 28, fontWeight: "900", color: theme.text, letterSpacing: -1.5 },
  tm: { fontSize: 12, fontWeight: "800", color: theme.textDim, marginLeft: 1 },
  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.cyan,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  emailText: { fontSize: 11, color: theme.textDim, maxWidth: 140, textAlign: "right" },
  netWorthCard: {
    backgroundColor: theme.panel,
    borderRadius: theme.radiusLg,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  netWorthLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textDim,
    letterSpacing: 2,
    marginBottom: 6,
  },
  netWorthValue: { fontSize: 40, fontWeight: "900" },
  netWorthValuePrecise: { fontSize: 28 },
  netWorthHint: {
    fontSize: 11,
    color: theme.textDim,
    marginTop: 10,
    lineHeight: 16,
  },
  tileRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  tile: {
    flex: 1,
    backgroundColor: theme.panel,
    borderRadius: theme.radiusSm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.textDim,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tileValue: { fontSize: 15, fontWeight: "800" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textDim,
    letterSpacing: 2,
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.panel,
    borderRadius: theme.radiusMd,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  accountName: { fontSize: 14, fontWeight: "700", color: theme.text },
  accountSub: { fontSize: 11, color: theme.textDim, marginTop: 2 },
  accountBalance: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.text,
    fontVariant: ["tabular-nums"],
  },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: theme.textDim, marginBottom: 24 },
  connectBtn: {
    backgroundColor: theme.text,
    borderRadius: theme.radiusSm,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  connectBtnText: { fontSize: 14, fontWeight: "800", color: theme.bg },
  coreHint: {
    fontSize: 10,
    color: theme.textDim,
    marginTop: 20,
    fontStyle: "italic",
  },
});
