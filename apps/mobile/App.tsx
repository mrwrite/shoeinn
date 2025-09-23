import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, View, Text, StyleSheet } from 'react-native';

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://192.168.128.1:8000/services')
      .then((res) => {
        if (!res.ok) {
          throw new Error('network error');
        }
        return res.json();
      })
      .then(setServices)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
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
            <Text>${item.price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No services available.</Text>}
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
  error: {
    color: 'red',
  },
});
