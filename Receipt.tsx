"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TransactionItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TransactionData {
  customer_name: string;
  transaction_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  items: TransactionItem[];
}

export default function Receipt() {
  const router = useRouter();
  const { txn } = useLocalSearchParams(); // Gets the ?txn=ID from URL
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TransactionData | null>(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [txn]);

      const fetchTransactionDetails = async () => {
      try {
    // Note: ensure the filename 'receipt.php' and param 'txn' are correct
    const res = await fetch(`http://localhost/starbux/Starbucks/api/receipt.php?txn=${txn}`);
    
    if (!res.ok) throw new Error("Network response was not ok");
    
    const json = await res.json();

    if (json.success) {
      setData(json.data);
    } else {
      console.error("Data error:", json.message);
    }
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#036635" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#036635", "#00754A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.receiptCard}>
          <Image
            source={require("../assets/images/starbucks-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Order Complete</Text>
          <Text style={styles.txnId}>ID: #TXN-{txn}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{data?.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{data?.transaction_date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment:</Text>
            <Text style={styles.value}>{data?.payment_method}</Text>
          </View>

          <View style={styles.divider} />

          {/* Table Header */}
          <View style={styles.itemRow}>
            <Text style={[styles.itemLabel, { flex: 2, fontWeight: "bold" }]}>Item</Text>
            <Text style={[styles.itemLabel, { flex: 0.5, textAlign: "center", fontWeight: "bold" }]}>Qty</Text>
            <Text style={[styles.itemLabel, { flex: 1, textAlign: "right", fontWeight: "bold" }]}>Price</Text>
          </View>

          {data?.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.itemText, { flex: 2 }]}>{item.product_name}</Text>
              <Text style={[styles.itemText, { flex: 0.5, textAlign: "center" }]}>{item.quantity}</Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: "right" }]}>₱{Number(item.subtotal).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₱{data ? Number(data.subtotal).toFixed(2) : "0.00"}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>₱{data ? Number(data.subtotal).toFixed(2) : "0.00"}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>₱{data ? Number(data.subtotal).toFixed(2) : "0.00"}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>₱{data ? Number(data.subtotal).toFixed(2) : "0.00"}</Text>
          </View>

          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={() => router.replace("/cashier")}
          >
            <Text style={styles.doneButtonText}>New Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  receiptCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 450,
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: { width: 80, height: 80, alignSelf: "center", marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#036635" },
  txnId: { textAlign: "center", color: "#666", marginBottom: 20 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 15, borderStyle: "dashed", borderRadius: 1 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { color: "#888", fontSize: 14 },
  value: { fontWeight: "600", color: "#333" },
  itemRow: { flexDirection: "row", marginBottom: 8 },
  itemLabel: { fontSize: 12, color: "#aaa" },
  itemText: { fontSize: 14, color: "#333" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalLabel: { color: "#666" },
  totalValue: { color: "#333" },
  grandTotalLabel: { fontSize: 20, fontWeight: "bold", color: "#036635" },
  grandTotalValue: { fontSize: 20, fontWeight: "bold", color: "#036635" },
  doneButton: {
    backgroundColor: "#036635",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  doneButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});