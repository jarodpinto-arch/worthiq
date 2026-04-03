import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  create,
  open,
  destroy,
  dismissLink,
  LinkIOSPresentationStyle,
} from "../../src/plaid/linkSession";
import { theme } from "../../src/theme";
import {
  createLinkToken,
  exchangePlaidPublicToken,
  disconnectPlaidItem,
  getAccounts,
} from "../../src/lib/api";
import { router } from "expo-router";

const WEB_CONNECT = "https://worthiq.io/connect";

const isExpoGo =
  Platform.OS !== "web" &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type AccountGroup = {
  plaidItemId: string;
  institution: string;
  accounts: any[];
};

function groupAccounts(accounts: any[]): AccountGroup[] {
  const m = new Map<string, AccountGroup>();
  for (const a of accounts) {
    const id = (a.plaid_item_id as string) ?? "_";
    const inst = (a.institution as string) || "Linked bank";
    if (!m.has(id)) {
      m.set(id, { plaidItemId: id, institution: inst, accounts: [] });
    }
    m.get(id)!.accounts.push(a);
  }
  return Array.from(m.values());
}

function typeIcon(type: string, color: string, size: number) {
  switch (type) {
    case "credit":
      return <MaterialCommunityIcons name="credit-card-outline" color={color} size={size} />;
    case "investment":
      return <MaterialCommunityIcons name="chart-line" color={color} size={size} />;
    default:
      return <MaterialCommunityIcons name="wallet-outline" color={color} size={size} />;
  }
}

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupAccounts(accounts), [accounts]);
  const hasAccounts = accounts.length > 0;

  const load = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data.accounts ?? []);
      setError(null);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startPlaidLink = useCallback(async () => {
    setError(null);
    setLinking(true);
    const platform = Platform.OS === "android" ? "android" : "ios";
    try {
      const { link_token } = await createLinkToken(platform);
      await destroy();
      create({
        token: link_token,
        onLoad: () => {
          open({
            iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
            onSuccess: async (success) => {
              try {
                await exchangePlaidPublicToken(success.publicToken);
                await load();
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Could not finish linking.";
                Alert.alert("Link failed", msg);
              } finally {
                await destroy();
                setLinking(false);
              }
            },
            onExit: async (exit) => {
              dismissLink();
              await destroy();
              setLinking(false);
              const msg = exit.error?.displayMessage ?? exit.error?.errorDisplayMessage;
              if (msg) setError(msg);
            },
          });
        },
      });
    } catch (e) {
      setLinking(false);
      const msg = e instanceof Error ? e.message : "Could not start Plaid.";
      setError(msg);
    }
  }, [load]);

  const confirmDisconnect = (itemId: string, label: string) => {
    Alert.alert(
      "Disconnect",
      `Remove ${label} from WorthIQ?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            if (itemId === "_") return;
            setDisconnecting(itemId);
            try {
              await disconnectPlaidItem(itemId);
              await load();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Disconnect failed.";
              Alert.alert("Error", msg);
            } finally {
              setDisconnecting(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom + 56 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{hasAccounts ? "Manage accounts" : "Connect bank"}</Text>
        <Text style={styles.subtitle}>
          {hasAccounts
            ? "Add another institution or disconnect one you no longer use."
            : "Link checking, credit cards, or brokerage accounts with Plaid."}
        </Text>

        {Platform.OS === "web" && (
          <View style={styles.banner}>
            <MaterialCommunityIcons name="monitor" size={20} color={theme.cyan} />
            <Text style={styles.bannerText}>
              Browser preview cannot run Plaid Link. Use worthiq.io/connect with the same account, or use
              the iOS/Android app.
            </Text>
          </View>
        )}

        {isExpoGo && (
          <View style={styles.banner}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.cyan} />
            <Text style={styles.bannerText}>
              Expo Go does not include the Plaid native module. Use a development build (see
              EAS-TESTFLIGHT.md) or connect in Safari below.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={theme.cyan} style={{ marginTop: 32 }} />
        ) : (
          <>
            {groups.map((g) => (
              <View key={g.plaidItemId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="bank-outline" size={18} color={theme.cyan} />
                  <Text style={styles.institution} numberOfLines={1}>
                    {g.institution}
                  </Text>
                  <Text style={styles.count}>
                    {g.accounts.length} account{g.accounts.length !== 1 ? "s" : ""}
                  </Text>
                  {g.plaidItemId !== "_" && (
                    <TouchableOpacity
                      onPress={() => confirmDisconnect(g.plaidItemId, g.institution)}
                      disabled={disconnecting === g.plaidItemId}
                      hitSlop={12}
                    >
                      <MaterialCommunityIcons
                        name="link-off"
                        size={20}
                        color={disconnecting === g.plaidItemId ? theme.textDim : theme.red}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {g.accounts.map((acc: any, i: number) => (
                  <View
                    key={acc.account_id ?? i}
                    style={[styles.accRow, i < g.accounts.length - 1 && styles.accRowBorder]}
                  >
                    <View style={styles.accIcon}>
                      {typeIcon(
                        acc.type,
                        acc.type === "credit" ? theme.red : acc.type === "investment" ? theme.purple : theme.green,
                        18
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.accName} numberOfLines={1}>
                        {acc.name}
                      </Text>
                      <Text style={styles.accMeta} numberOfLines={1}>
                        {acc.subtype}
                        {acc.mask ? ` · •••• ${acc.mask}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.accBal}>{fmt(acc.balances?.current ?? 0)}</Text>
                  </View>
                ))}
              </View>
            ))}

            {Platform.OS !== "web" && !isExpoGo && (
              <TouchableOpacity
                style={[styles.primaryBtn, linking && { opacity: 0.65 }]}
                onPress={startPlaidLink}
                disabled={linking}
                activeOpacity={0.9}
              >
                {linking ? (
                  <ActivityIndicator color="#0A0C10" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={22} color="#0A0C10" />
                    <Text style={styles.primaryBtnText}>
                      {hasAccounts ? "Add another bank" : "Connect bank in app"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => Linking.openURL(WEB_CONNECT)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="open-in-new" size={18} color={theme.cyan} />
              <Text style={styles.secondaryBtnText}>Open worthiq.io/connect</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: "900", color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginTop: 8, lineHeight: 20 },
  banner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: `${theme.cyan}18`,
    borderRadius: theme.radiusMd,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: `${theme.cyan}40`,
  },
  bannerText: { flex: 1, fontSize: 13, color: theme.textDim, lineHeight: 18 },
  errorBox: {
    marginTop: 16,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: theme.radiusMd,
    padding: 12,
  },
  errorText: { color: theme.red, fontSize: 13 },
  card: {
    marginTop: 18,
    backgroundColor: theme.panel,
    borderRadius: theme.radiusLg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSoft,
  },
  institution: { flex: 1, fontSize: 15, fontWeight: "800", color: theme.text },
  count: { fontSize: 11, color: theme.textDim, fontVariant: ["tabular-nums"] },
  accRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  accRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(30,41,59,0.6)" },
  accIcon: { width: 36, alignItems: "center" },
  accName: { fontSize: 14, fontWeight: "700", color: theme.text },
  accMeta: { fontSize: 11, color: theme.textDim, marginTop: 2, textTransform: "capitalize" },
  accBal: { fontSize: 14, fontWeight: "800", color: theme.text, fontVariant: ["tabular-nums"] },
  primaryBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.cyan,
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#0A0C10" },
  secondaryBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    paddingVertical: 14,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "700", color: theme.cyan },
});
