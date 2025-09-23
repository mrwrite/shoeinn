import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  price_cents: number;
  duration_min?: number | null;
  company: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  };
}

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  useEffect(() => {
    setLoading(true);
    fetch('http://192.168.128.1:8000/services')
      .then((res) => {
        if (!res.ok) {
          throw new Error('network error');
        }
        return res.json();
      })
      .then((data) => {
        setServices(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!services.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>No services available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.company}>{item.company.name}</Text>
            <Text style={styles.meta}>
              {item.company.city && item.company.state
                ? `${item.company.city}, ${item.company.state}`
                : 'Available'}
            </Text>
            <Text style={styles.meta}>
              Duration: {item.duration_min ? `${item.duration_min} min` : 'N/A'}
            </Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
  },
  meta: {
    fontSize: 14,
    color: '#555',
  },
  price: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
  },
  empty: {
    fontSize: 16,
    color: '#666',
  },
});
