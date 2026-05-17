import { supabase } from '../lib/supabase';
import { OrderStatus } from '../types';

/**
 * Dashboard Service - Real database queries for dashboard metrics
 * No fake data, only real Supabase queries
 */

export interface AdminDashboardStats {
  totalUsers: number;
  totalPharmacies: number;
  totalMedicines: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  activePharmacies: number;
  pendingPrescriptions: number;
}

export interface PharmacistDashboardStats {
  inventoryCount: number;
  pendingOrders: number;
  lowStockItems: number;
  todayOrders: number;
  completedToday: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'prescription' | 'pharmacy';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface LowStockItem {
  id: string;
  medicine_name: string;
  quantity: number;
  threshold: number;
  pharmacy_name?: string;
}

export interface PendingOrder {
  id: string;
  order_number: string;
  customer_name: string;
  items_count: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export const dashboardService = {
  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminDashboardStats> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total pharmacies
      const { count: totalPharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true });

      // Get active pharmacies
      const { count: activePharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total medicines
      const { count: totalMedicines } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true });

      // Get total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get completed orders
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get pending prescriptions
      const { count: pendingPrescriptions } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        totalUsers: totalUsers || 0,
        totalPharmacies: totalPharmacies || 0,
        totalMedicines: totalMedicines || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
        activePharmacies: activePharmacies || 0,
        pendingPrescriptions: pendingPrescriptions || 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  /**
   * Get recent activity for admin dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrders) {
        recentOrders.forEach(order => {
          activities.push({
            id: order.id,
            type: 'order',
            message: `Order ${order.order_number} - ${order.status}`,
            timestamp: order.created_at,
            status: order.status === 'completed' ? 'success' : 
                   order.status === 'cancelled' ? 'error' : 'warning'
          });
        });
      }

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentUsers) {
        recentUsers.forEach(user => {
          activities.push({
            id: user.id,
            type: 'user',
            message: `New user registered: ${user.full_name}`,
            timestamp: user.created_at,
            status: 'success'
          });
        });
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  /**
   * Get pharmacist dashboard statistics for specific pharmacy
   */
  async getPharmacistStats(pharmacyId: string): Promise<PharmacistDashboardStats> {
    try {
      // Get inventory count
      const { count: inventoryCount } = await supabase
        .from('pharmacy_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('is_active', true);

      // Get pending orders for this pharmacy
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'pending');

      // Get low stock items (quantity <= low_stock_threshold)
      const { data: lowStockData } = await supabase
        .from('pharmacy_inventory')
        .select('quantity, low_stock_threshold')
        .eq('pharmacy_id', pharmacyId)
        .eq('is_active', true);

      const lowStockItems = lowStockData?.filter(
        item => item.quantity <= item.low_stock_threshold
      ).length || 0;

      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', today.toISOString());

      // Get completed orders today
      const { count: completedToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString());

      // Calculate total revenue from completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'completed');

      const totalRevenue = completedOrders?.reduce(
        (sum, order) => sum + (order.total_amount || 0), 
        0
      ) || 0;

      return {
        inventoryCount: inventoryCount || 0,
        pendingOrders: pendingOrders || 0,
        lowStockItems,
        todayOrders: todayOrders || 0,
        completedToday: completedToday || 0,
        totalRevenue
      };
    } catch (error) {
      console.error('Error fetching pharmacist stats:', error);
      throw error;
    }
  },

  /**
   * Get pending orders for pharmacist
   */
  async getPendingOrders(pharmacyId: string, limit: number = 10): Promise<PendingOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          user_id
        `)
        .eq('pharmacy_id', pharmacyId)
        .in('status', ['pending', 'confirmed', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Get user names and item counts
      const ordersWithDetails = await Promise.all(
        data.map(async (order) => {
          // Get customer name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();

          // Get items count
          const { count: itemsCount } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);

          return {
            id: order.id,
            order_number: order.order_number,
            customer_name: profile?.full_name || 'Unknown Customer',
            items_count: itemsCount || 0,
            total_amount: order.total_amount,
            status: order.status as OrderStatus,
            created_at: order.created_at
          };
        })
      );

      return ordersWithDetails;
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  },

  /**
   * Get low stock items for pharmacist
   */
  async getLowStockItems(pharmacyId: string, limit: number = 10): Promise<LowStockItem[]> {
    try {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .select(`
          id,
          quantity,
          low_stock_threshold,
          medicine:medicines(brand_name)
        `)
        .eq('pharmacy_id', pharmacyId)
        .eq('is_active', true)
        .order('quantity', { ascending: true })
        .limit(limit * 2); // Get more to filter

      if (error) throw error;

      if (!data) return [];

      // Filter items where quantity <= threshold
      const lowStock = data
        .filter(item => item.quantity <= item.low_stock_threshold)
        .slice(0, limit)
        .map(item => ({
          id: item.id,
          medicine_name: (item.medicine as any)?.brand_name || 'Unknown Medicine',
          quantity: item.quantity,
          threshold: item.low_stock_threshold
        }));

      return lowStock;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  }
};
