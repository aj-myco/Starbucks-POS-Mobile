"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Product {
  id: number;
  product_name: string;
  description: string;
  price: number;
  status: string;
  image: string;
  stock: number;
}

interface SoldProduct {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

interface RestockLog {
  id: number;
  product_name: string;
  previous_stock: number;
  added_stock: number;
  new_stock: number;
  restocked_by: string;
  restocked_at: string;
}

export default function Reports() {
  const router = useRouter();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [restockLogs, setRestockLogs] = useState<RestockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');

  useEffect(() => {
    loadReports();
  }, [selectedDate, reportType]);

  const loadReports = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please login again");
        router.replace("/");
        return;
      }

      // Load available products
      const productsRes = await fetch("http://localhost/starbucks/api/products.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsData = await productsRes.json();
      if (productsData.success) {
        setAvailableProducts(productsData.products);
      }

      // Load reports based on type
      if (reportType === 'sales') {
        const reportsRes = await fetch(`http://localhost/starbucks/api/reports.php?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reportsData = await reportsRes.json();
        if (reportsData.success) {
          setSoldProducts(reportsData.soldProducts);
        }
      } else {
        const inventoryRes = await fetch(`http://localhost/starbucks/api/reports.php?type=inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const inventoryData = await inventoryRes.json();
        if (inventoryData.success) {
          setRestockLogs(inventoryData.restockLogs);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const renderAvailableProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.productPrice}>₱{item.price}</Text>
      <Text style={styles.productStock}>Stock: {item.stock}</Text>
      <Text style={styles.productStatus}>Available</Text>
    </View>
  );

  const renderSoldProduct = ({ item }: { item: SoldProduct }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.productQuantity}>Sold: {item.total_quantity_sold}</Text>
      <Text style={styles.productRevenue}>Revenue: ₱{parseFloat(item.total_revenue.toString()).toFixed(2)}</Text>
    </View>
  );

  const renderRestockLog = ({ item }: { item: RestockLog }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.productQuantity}>Previous: {item.previous_stock}</Text>
      <Text style={styles.productRevenue}>Added: +{item.added_stock}</Text>
      <Text style={styles.productStock}>New: {item.new_stock}</Text>
      <Text style={styles.productStatus}>By: {item.restocked_by}</Text>
      <Text style={styles.productStatus}>{new Date(item.restocked_at).toLocaleString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={["#036635", "#00754A"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Reports...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#036635", "#00754A"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Reports</Text>

        <ScrollView style={styles.reportsContainer}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Products ({availableProducts.length})</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => loadReports()}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableProducts}
              renderItem={renderAvailableProduct}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {reportType === 'sales' ? `Sold Products Report - ${selectedDate}` : 'Inventory Restock Logs'}
              </Text>
              <View style={styles.reportTypeControls}>
                <TouchableOpacity
                  style={[styles.reportTypeButton, reportType === 'sales' && styles.activeReportTypeButton]}
                  onPress={() => setReportType('sales')}
                >
                  <Text style={[styles.reportTypeButtonText, reportType === 'sales' && styles.activeReportTypeButtonText]}>Sales</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportTypeButton, reportType === 'inventory' && styles.activeReportTypeButton]}
                  onPress={() => setReportType('inventory')}
                >
                  <Text style={[styles.reportTypeButtonText, reportType === 'inventory' && styles.activeReportTypeButtonText]}>Inventory</Text>
                </TouchableOpacity>
              </View>
            </View>
            {reportType === 'sales' && (
              <View style={styles.dateControls}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => changeDate(-1)}
                >
                  <Text style={styles.dateButtonText}>Previous Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => changeDate(1)}
                >
                  <Text style={styles.dateButtonText}>Next Day</Text>
                </TouchableOpacity>
              </View>
            )}
            {reportType === 'sales' ? (
              <FlatList
                data={soldProducts}
                renderItem={renderSoldProduct}
                keyExtractor={(item) => item.product_id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <FlatList
                data={restockLogs}
                renderItem={renderRestockLog}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Cashier</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  reportsContainer: {
    flex: 1,
    backgroundColor: "rgba(245, 243, 238, 0.97)",
    borderRadius: 10,
    padding: 15,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#036635",
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: "rgba(245, 243, 238, 0.97)",
    borderRadius: 10,
    padding: 10,
    margin: 5,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#036635",
    textAlign: "center",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#00754A",
    marginBottom: 5,
  },
  productStatus: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "bold",
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  productRevenue: {
    fontSize: 14,
    color: "#00754A",
    fontWeight: "bold",
  },
  productStock: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: "#00754A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#036635",
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  backButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  dateControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: "#00754A",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#036635",
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  reportTypeControls: {
    flexDirection: "row",
  },
  reportTypeButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#00754A",
  },
  activeReportTypeButton: {
    backgroundColor: "#00754A",
  },
  reportTypeButtonText: {
    color: "#00754A",
    fontWeight: "bold",
    fontSize: 12,
  },
  activeReportTypeButtonText: {
    color: "#fff",
  },
});
