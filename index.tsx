import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Home,
  ShoppingCart,
  BarChart3,
  FileChartColumn,
  BadgePercent,
  CreditCard,
  Users,
  LogOut,
} from 'lucide-react-native';

/* ───────────────── Interfaces ───────────────── */
interface Product {
  id: number;
  product_name: string;
  price: number;
  image_path: string | null;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

/* ───────────────── Helpers ───────────────── */
const resolveImageUri = (path?: string | null) => {
  if (!path) return 'https://via.placeholder.com/80';
  if (path.startsWith('http')) return path;
  // Adjusted to match your folder structure
  return `http://localhost/starbux/Starbucks/${path}`;
};

/* ───────────────── Component ───────────────── */
export default function CashierHome() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarWidth = screenWidth * 0.7;
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  /* ───────────── Data Fetching ───────────── */
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost/starbux/Starbucks/api/products.php');
      const data = await res.json();
      
      // Safety: Ensure data.products exists before setting state
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]); // Fallback to empty array to prevent .forEach crash
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ───────────── Cart Logic ───────────── */
  // Fixed the crash by adding Array.isArray check
  useEffect(() => {
    const items: CartItem[] = [];
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (cart[p.id]) {
          items.push({ product: p, quantity: cart[p.id] });
        }
      });
    }
    setCartItems(items);
  }, [cart, products]);

  const addToCart = async (product: Product) => {
    if ((cart[product.id] || 0) >= product.stock) return;
    const newCart = { ...cart, [product.id]: (cart[product.id] || 0) + 1 };
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  /* ───────────── Sidebar ───────────── */
  const toggleSidebar = () => {
    const next = !sidebarOpen;
    Animated.timing(sidebarAnim, {
      toValue: next ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarOpen(next);
  };

  const sidebarItems = [
    { label: 'Menu', route: '/cashier', icon: Home },
    { label: 'Cart', route: '/cashier/cart', icon: ShoppingCart },
    { label: 'Sales Report', route: '/cashier/sales-report', icon: BarChart3 },
    { label: 'Inventory', route: '/cashier/inventory', icon: FileChartColumn },
    { label: 'Discounts & Tax', route: '/cashier/discounts', icon: BadgePercent },
    { label: 'Salary', route: '/cashier/salary', icon: CreditCard },
    { label: 'Employees', route: '/cashier/employees', icon: Users },
  ];

  /* ───────────── Render Helpers ───────────── */
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: resolveImageUri(item.image_path) }} 
        style={styles.productImage} 
        resizeMode="contain"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
        <Text style={styles.price}>₱{Number(item.price).toFixed(2)}</Text>
        <Text style={styles.stock}>Stock: {item.stock}</Text>
        <TouchableOpacity 
          style={[styles.addBtn, item.stock <= 0 && styles.disabledBtn]} 
          onPress={() => addToCart(item)}
          disabled={item.stock <= 0}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {item.stock > 0 ? 'Add to Order' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#036635', '#00754A']} style={{ flex: 1 }}>
      {/* SIDEBAR */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
      >
        <View style={styles.sidebarContent}>
          <View style={styles.logoBox}>
            <Image
              source={require('../images/starbucks__hyrule__logo_by_lammypepsi_dk8js1p.png')}
              style={styles.logo}
            />
            <Text style={styles.sidebarTitle}>Starbucks POS</Text>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {sidebarItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.sidebarItem}
                  onPress={() => {
                    router.push(item.route as any);
                    toggleSidebar();
                  }}
                >
                  <Icon color="#fff" size={20} />
                  <Text style={styles.sidebarText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.logout}>
            <LogOut color="#fff" size={20} />
            <Text style={styles.sidebarText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* MAIN CONTENT */}
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuText}>☰ Menu</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Items</Text>
          <TouchableOpacity onPress={() => router.push('/cashier/cart')}>
             <ShoppingCart color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Brewing Menu...</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={i => i.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: '#fff' }}>No products available.</Text>
              </View>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

/* ───────────────── Styles ───────────────── */
const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#006241',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sidebarContent: { flex: 1, paddingTop: 40 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20 
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  menuButton: { padding: 5 },
  menuText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  logoBox: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 80, height: 80, borderRadius: 40 },
  sidebarTitle: { color: '#fff', fontWeight: 'bold', marginTop: 10, fontSize: 18 },
  sidebarItem: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 25, alignItems: 'center' },
  sidebarText: { color: '#fff', marginLeft: 15, fontSize: 16 },
  logout: { flexDirection: 'row', padding: 25, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.2)' },
  listContainer: { paddingHorizontal: 10, paddingBottom: 50 },
  productCard: {
    backgroundColor: '#fff',
    flex: 1,
    margin: 8,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: { width: '100%', height: 100, marginBottom: 10 },
  productInfo: { width: '100%', alignItems: 'center' },
  productName: { fontWeight: 'bold', fontSize: 14, color: '#333', textAlign: 'center' },
  price: { color: '#036635', fontWeight: 'bold', marginVertical: 2 },
  stock: { fontSize: 11, color: '#888', marginBottom: 8 },
  addBtn: { backgroundColor: '#036635', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, width: '100%', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});