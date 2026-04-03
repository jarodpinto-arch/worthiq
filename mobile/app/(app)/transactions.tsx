import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getTransactions } from "../../src/lib/api";
import { theme } from "../../src/theme";

function fmtAmount(n: number) {
  const abs = Math.abs(n);
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(abs);
  return n < 0 ? `+${s}` : `-${s}`;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function TransactionsScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getTransactions();
      const list = data.transactions ?? [];
      list.sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRows(list);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={theme.cyan} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.sub}>Last 90 days</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item, i) => item.transaction_id ?? String(i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.cyan} />
        }
        contentContainerStyle={rows.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Connect a bank on the Connect tab or at worthiq.io</Text>
          </View>
        }
        renderItem={({ item }) => {
          const label = item.merchant_name || item.name || "Transaction";
          const cat = Array.isArray(item.category) && item.category[0] ? item.category[0] : null;
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.rowMeta}>
                  {fmtDate(item.date)}
                  {cat ? ` · ${cat}` : ""}
                  {item.pending ? " · Pending" : ""}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowAmt,
                  (item.amount ?? 0) > 0 ? styles.amtSpend : styles.amtCredit,
                ]}
              >
                {fmtAmount(item.amount ?? 0)}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "900", color: theme.text },
  sub: { fontSize: 12, color: theme.textDim, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  emptyContainer: { flexGrow: 1, paddingHorizontal: 20 },
  empty: { paddingTop: 48, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: theme.textMuted, textAlign: "center", lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.panel,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.text },
  rowMeta: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
  rowAmt: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"] },
  amtSpend: { color: theme.red },
  amtCredit: { color: theme.green },
});
