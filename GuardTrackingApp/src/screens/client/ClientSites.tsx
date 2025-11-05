import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { MenuIcon, NotificationIcon } from '../../components/ui/AppIcons';
import SiteCard from '../../components/client/SiteCard';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { siteService, Site } from '../../services/siteService';

interface SiteData {
  id: string;
  name: string;
  address: string;
  guardName: string;
  guardAvatar?: string;
  status: 'Active' | 'Upcoming' | 'Missed';
  shiftTime?: string;
  checkInTime?: string;
}

const ClientSites: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleAddNewSite = () => {
    navigation.navigate('AddSite');
  };

  const handleSitePress = (siteId: string) => {
    navigation.navigate('SiteDetails', { siteId });
  };

  const handleMoreOptions = (siteId: string) => {
    console.log('More options for site:', siteId);
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await siteService.getClientSites();
      setSites(response.sites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await siteService.getClientSites();
      setSites(response.sites);
    } catch (error) {
      console.error('Error refreshing sites:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch sites on component mount
  useFocusEffect(
    React.useCallback(() => {
      fetchSites();
    }, [])
  );

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MenuIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Sites</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewSite}>
          <Text style={styles.addButtonText}>Add New Site</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && sites.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading sites...</Text>
          </View>
        ) : sites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sites found</Text>
            <Text style={styles.emptySubtext}>Add your first site to get started</Text>
          </View>
        ) : (
          sites.map((site) => {
            // Transform Site to SiteData for SiteCard compatibility
            const siteData: SiteData = {
              id: site.id,
              name: site.name,
              address: site.address,
              guardName: 'No Guard Assigned', // Default value, will be updated when shifts are implemented
              status: 'Upcoming' as const, // Default status, will be updated based on actual shift data
            };
            
            return (
              <SiteCard
                key={site.id}
                site={siteData}
                onPress={() => handleSitePress(site.id)}
                onMoreOptions={() => handleMoreOptions(site.id)}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ClientSites;
