import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Search, X } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';
import apiService from '../../services/api';

interface Client {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  companyName?: string;
}

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null, client?: Client) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  variant?: 'dropdown' | 'modal'; // 'dropdown' for inline, 'modal' for popup
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  label = 'Client',
  required = false,
  placeholder = 'Select client',
  variant = 'modal',
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminClients();
      if (response.success && response.data) {
        const clientsData = response.data.clients || response.data.items || [];
        setClients(clientsData);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading clients:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === value);

  const getClientLabel = (client: Client): string => {
    if (client.companyName) {
      return client.companyName;
    }
    const name = `${client.user.firstName || ''} ${client.user.lastName || ''}`.trim();
    return name || client.user.email;
  };

  const filteredClients = clients.filter(client => {
    const label = getClientLabel(client).toLowerCase();
    const email = client.user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return label.includes(query) || email.includes(query);
  });

  const handleSelectClient = (client: Client) => {
    onChange(client.id, client);
    setShowModal(false);
    setSearchQuery('');
  };

  const renderClientItem = ({ item }: { item: Client }) => {
    const isSelected = item.id === value;
    const label = getClientLabel(item);
    
    return (
      <TouchableOpacity
        style={[styles.clientItem, isSelected && styles.clientItemSelected]}
        onPress={() => handleSelectClient(item)}
      >
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, isSelected && styles.clientNameSelected]}>
            {label}
          </Text>
          {item.user.email && (
            <Text style={[styles.clientEmail, isSelected && styles.clientEmailSelected]}>
              {item.user.email}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (variant === 'dropdown') {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
        )}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowModal(true)}
        >
          <Text style={[styles.dropdownText, !selectedClient && styles.placeholder]}>
            {selectedClient ? getClientLabel(selectedClient) : placeholder}
          </Text>
          <ChevronDown size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No clients found</Text>
                  </View>
                }
              />
            )}
          </View>
        </Modal>
      </View>
    );
  }

  // Modal variant (popup)
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          {selectedClient ? (
            <>
              <Text style={styles.selectorText}>{getClientLabel(selectedClient)}</Text>
              {selectedClient.user.email && (
                <Text style={styles.selectorSubtext}>{selectedClient.user.email}</Text>
              )}
            </>
          ) : (
            <Text style={[styles.selectorText, styles.placeholder]}>{placeholder}</Text>
          )}
        </View>
        <ChevronDown size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No clients found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  dropdownText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  placeholder: {
    color: COLORS.textSecondary,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  selectorSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundPrimary,
  },
  clientItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  clientNameSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  clientEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clientEmailSelected: {
    color: COLORS.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default ClientSelector;

