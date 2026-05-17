import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, DollarSign, Download, FileText, Loader, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminPageHeader from '../../components/AdminPageHeader';
import EmptyState from '../../components/EmptyState';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  totalUsers: number;
  totalPharmacies: number;
  totalMedicines: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingOrders: number;
  completedOrders: number;
  ordersByStatus: Record<string, number>;
  topMedicines: Array<{ name: string; count: number }>;
  usersByRole: Record<string, number>;
}

const Reports = () => {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('30days');

  const copy = {
    title: t('screens.adminReports.title'),
    subtitle: t('screens.adminReports.subtitle'),
    periodLabel: t('screens.adminReports.periodLabel'),
    periods: {
      '7days': t('screens.adminReports.periods.7days'),
      '30days': t('screens.adminReports.periods.30days'),
      '90days': t('screens.adminReports.periods.90days'),
      all: t('screens.adminReports.periods.all'),
    },
    loadError: t('screens.adminReports.loadError'),
    totalUsers: t('screens.adminReports.totalUsers'),
    activePharmacies: t('screens.adminReports.activePharmacies'),
    medicines: t('screens.adminReports.medicines'),
    revenue: t('screens.adminReports.revenue'),
    orderStatus: t('screens.adminReports.orderStatus'),
    topMedicines: t('screens.adminReports.topMedicines'),
    usersByRole: t('screens.adminReports.usersByRole'),
    platformHealth: t('screens.adminReports.platformHealth'),
    followUp: t('screens.adminReports.followUp'),
    completedOrders: t('screens.adminReports.completedOrders'),
    pendingOrders: t('screens.adminReports.pendingOrders'),
    lowStock: t('screens.adminReports.lowStock'),
    noOrderData: t('screens.adminReports.noOrderData'),
    noMedicineData: t('screens.adminReports.noMedicineData'),
    exportPDF: 'Export PDF',
    exportCSV: 'Export CSV',
    exporting: 'Exporting...',
    roleLabels: {
      customer: t('screens.adminReports.roleLabels.customer'),
      pharmacist: t('screens.adminReports.roleLabels.pharmacist'),
      admin: t('screens.adminReports.roleLabels.admin'),
    },
    statusLabels: {
      pending: t('screens.adminReports.statusLabels.pending'),
      confirmed: t('screens.adminReports.statusLabels.confirmed'),
      preparing: t('screens.adminReports.statusLabels.preparing'),
      ready: t('screens.adminReports.statusLabels.ready'),
      out_for_delivery: t('screens.adminReports.statusLabels.out_for_delivery'),
      completed: t('screens.adminReports.statusLabels.completed'),
      cancelled: t('screens.adminReports.statusLabels.cancelled'),
      rejected: t('screens.adminReports.statusLabels.rejected'),
    } as Record<string, string>,
    sar: t('screens.adminReports.currency'),
    orders: t('screens.adminReports.orders'),
    completedRate: t('screens.adminReports.completedRate'),
  };

  useEffect(() => {
    void fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date(0);
      if (dateRange === '7days') startDate = new Date(now.getTime() - 7 * 86400000);
      else if (dateRange === '30days') startDate = new Date(now.getTime() - 30 * 86400000);
      else if (dateRange === '90days') startDate = new Date(now.getTime() - 90 * 86400000);

      const [usersRes, pharmaciesRes, medicinesRes, ordersRes, lowStockRes, usersByRoleRes, topMedicinesData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('pharmacies').select('*', { count: 'exact', head: true }),
        supabase.from('medicines').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('status,total_amount,created_at').gte('created_at', startDate.toISOString()),
        supabase.from('pharmacy_inventory').select('*', { count: 'exact', head: true }).lt('quantity', 10).gt('quantity', 0),
        supabase.from('profiles').select('role'),
        supabase.from('order_items').select('medicine:medicines(brand_name,brand_name_ar)').limit(20),
      ]);

      const ordersByStatus: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        out_for_delivery: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
      };
      let totalRevenue = 0;
      let completedCount = 0;
      let pendingCount = 0;

      (ordersRes.data || []).forEach((order: any) => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        if (order.status === 'completed') {
          totalRevenue += Number(order.total_amount || 0);
          completedCount += 1;
        }
        if (order.status === 'pending') pendingCount += 1;
      });

      const usersByRole: Record<string, number> = { customer: 0, pharmacist: 0, admin: 0 };
      (usersByRoleRes.data || []).forEach((item: any) => {
        usersByRole[item.role] = (usersByRole[item.role] || 0) + 1;
      });

      const medicineCounts: Record<string, number> = {};
      (topMedicinesData.data || []).forEach((item: any) => {
        const medicine = item.medicine;
        const name = language === 'ar' ? medicine?.brand_name_ar || medicine?.brand_name || '—' : medicine?.brand_name || medicine?.brand_name_ar || '—';
        medicineCounts[name] = (medicineCounts[name] || 0) + 1;
      });

      const topMedicines = Object.entries(medicineCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        totalUsers: usersRes.count || 0,
        totalPharmacies: pharmaciesRes.count || 0,
        totalMedicines: medicinesRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue,
        lowStockItems: lowStockRes.count || 0,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        ordersByStatus,
        topMedicines,
        usersByRole,
      });
    } catch (error: any) {
      showToast(error.message || copy.loadError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!data) return;
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Function to load logo image
      const loadLogoImage = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      };
      
      // Try to load logo, will be null if fails
      const logoDataUrl = await loadLogoImage();
      
      // Logo positioning
      const logoWidth = 35;
      const logoHeight = 18;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 12;
      let yPos = 38;
      
      // Add logo if loaded successfully
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        yPos = logoY + logoHeight + 8;
      } else {
        // Fallback: text logo if image fails to load
        doc.setFontSize(22);
        doc.setTextColor(9, 154, 167);
        doc.text('MediSmart', pageWidth / 2, 22, { align: 'center' });
        doc.setDrawColor(9, 154, 167);
        doc.setLineWidth(0.5);
        doc.line(60, 26, pageWidth - 60, 26);
        yPos = 35;
      }
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(15, 47, 49);
      doc.text('System Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${copy.periods[dateRange as keyof typeof copy.periods]}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
      
      // Summary Statistics
      doc.setFontSize(14);
      doc.setTextColor(15, 47, 49);
      doc.text('Summary Statistics', 14, yPos);
      yPos += 8;
      
      const summaryData = [
        [copy.totalUsers, data.totalUsers.toString()],
        [copy.activePharmacies, data.totalPharmacies.toString()],
        [copy.medicines, data.totalMedicines.toString()],
        [copy.revenue, `${data.totalRevenue.toFixed(2)} ${copy.sar}`],
        [copy.completedOrders, data.completedOrders.toString()],
        [copy.pendingOrders, data.pendingOrders.toString()],
        [copy.lowStock, data.lowStockItems.toString()],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [9, 154, 167] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Orders by Status
      doc.setFontSize(14);
      doc.text('Orders by Status', 14, yPos);
      yPos += 8;
      
      const statusData = Object.entries(data.ordersByStatus)
        .filter(([, count]) => Number(count) > 0)
        .map(([status, count]) => [
          copy.statusLabels[status] || status,
          count.toString(),
          data.totalOrders > 0 ? `${((Number(count) / data.totalOrders) * 100).toFixed(1)}%` : '0%'
        ]);
      
      if (statusData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Status', 'Count', 'Percentage']],
          body: statusData,
          theme: 'grid',
          headStyles: { fillColor: [9, 154, 167] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Top Medicines
      if (data.topMedicines.length > 0) {
        doc.setFontSize(14);
        doc.text('Top Medicines', 14, yPos);
        yPos += 8;
        
        const medicineData = data.topMedicines.map((med, idx) => [
          (idx + 1).toString(),
          med.name,
          med.count.toString()
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Rank', 'Medicine', 'Orders']],
          body: medicineData,
          theme: 'grid',
          headStyles: { fillColor: [9, 154, 167] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Users by Role
      doc.setFontSize(14);
      doc.text('Users by Role', 14, yPos);
      yPos += 8;
      
      const roleData = Object.entries(data.usersByRole).map(([role, count]) => [
        copy.roleLabels[role as keyof typeof copy.roleLabels],
        count.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Role', 'Count']],
        body: roleData,
        theme: 'grid',
        headStyles: { fillColor: [9, 154, 167] },
      });
      
      // Save PDF
      doc.save(`medismart-report-${dateRange}-${Date.now()}.pdf`);
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    setExporting(true);
    
    try {
      let csv = 'MediSmart System Report\n';
      csv += `Period: ${copy.periods[dateRange as keyof typeof copy.periods]}\n`;
      csv += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      // Summary Statistics
      csv += 'Summary Statistics\n';
      csv += 'Metric,Value\n';
      csv += `${copy.totalUsers},${data.totalUsers}\n`;
      csv += `${copy.activePharmacies},${data.totalPharmacies}\n`;
      csv += `${copy.medicines},${data.totalMedicines}\n`;
      csv += `${copy.revenue},${data.totalRevenue.toFixed(2)} ${copy.sar}\n`;
      csv += `${copy.completedOrders},${data.completedOrders}\n`;
      csv += `${copy.pendingOrders},${data.pendingOrders}\n`;
      csv += `${copy.lowStock},${data.lowStockItems}\n\n`;
      
      // Orders by Status
      csv += 'Orders by Status\n';
      csv += 'Status,Count,Percentage\n';
      Object.entries(data.ordersByStatus)
        .filter(([, count]) => Number(count) > 0)
        .forEach(([status, count]) => {
          const percentage = data.totalOrders > 0 ? ((Number(count) / data.totalOrders) * 100).toFixed(1) : '0';
          csv += `${copy.statusLabels[status] || status},${count},${percentage}%\n`;
        });
      csv += '\n';
      
      // Top Medicines
      if (data.topMedicines.length > 0) {
        csv += 'Top Medicines\n';
        csv += 'Rank,Medicine,Orders\n';
        data.topMedicines.forEach((med, idx) => {
          csv += `${idx + 1},${med.name},${med.count}\n`;
        });
        csv += '\n';
      }
      
      // Users by Role
      csv += 'Users by Role\n';
      csv += 'Role,Count\n';
      Object.entries(data.usersByRole).forEach(([role, count]) => {
        csv += `${copy.roleLabels[role as keyof typeof copy.roleLabels]},${count}\n`;
      });
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `medismart-report-${dateRange}-${Date.now()}.csv`;
      link.click();
      
      showToast('CSV exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="animate-spin text-[#099aa7]" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pt-32">
        <div className="container mx-auto max-w-4xl rounded-[32px] border border-slate-100 bg-white p-10 shadow-sm">
          <EmptyState icon={AlertCircle} title={copy.loadError} message={copy.loadError} />
        </div>
      </div>
    );
  }

  const completionRate = data.totalOrders > 0 ? Math.round((data.completedOrders / data.totalOrders) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="container mx-auto max-w-7xl">
        <AdminPageHeader title={copy.title} subtitle={copy.subtitle} onRefresh={fetchReportData} refreshing={loading} />

        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">{copy.periodLabel}</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-[#099aa7]"
            >
              {Object.entries(copy.periods).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => void exportToPDF()}
              disabled={exporting || !data}
              className="inline-flex items-center gap-2 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={18} />
              <span>{exporting ? copy.exporting : copy.exportPDF}</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={exporting || !data}
              className="inline-flex items-center gap-2 px-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span>{exporting ? copy.exporting : copy.exportCSV}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#1f2f31]">{copy.orderStatus}</h2>
            <div className="space-y-4">
              {Object.entries(data.ordersByStatus).filter(([, count]) => Number(count) > 0).length === 0 ? (
                <p className="text-sm text-slate-500">{copy.noOrderData}</p>
              ) : (
                Object.entries(data.ordersByStatus).map(([status, count]) => {
                  if (!Number(count)) return null;
                  const numericCount = Number(count);
                  const percentage = data.totalOrders > 0 ? (numericCount / data.totalOrders) * 100 : 0;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                        <span>{copy.statusLabels[status] || status}</span>
                        <span>{numericCount}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#099aa7]" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#1f2f31]">{copy.topMedicines}</h2>
            {data.topMedicines.length === 0 ? (
              <p className="text-sm text-slate-500">{copy.noMedicineData}</p>
            ) : (
              <div className="space-y-3">
                {data.topMedicines.map((medicine, index) => (
                  <div key={medicine.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div>
                      <div className="font-semibold text-[#1f2f31]">{medicine.name}</div>
                      <div className="text-sm text-slate-500">#{index + 1}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#099aa7] shadow-sm">{medicine.count} {copy.orders}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#1f2f31]">{copy.usersByRole}</h2>
            <div className="space-y-4">
              {Object.entries(data.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-medium text-[#1f2f31]">{copy.roleLabels[role as keyof typeof copy.roleLabels]}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">{count}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-[#1f2f31]">{copy.platformHealth}</h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>{copy.activePharmacies}</span><strong>{data.totalPharmacies}</strong></div>
                <div className="flex items-center justify-between"><span>{copy.medicines}</span><strong>{data.totalMedicines}</strong></div>
                <div className="flex items-center justify-between"><span>{copy.completedRate}</span><strong>{completionRate}%</strong></div>
              </div>
            </section>
            <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-[#1f2f31]">{copy.followUp}</h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>{copy.pendingOrders}</span><strong>{data.pendingOrders}</strong></div>
                <div className="flex items-center justify-between"><span>{copy.lowStock}</span><strong>{data.lowStockItems}</strong></div>
                <div className="flex items-center justify-between"><span>{copy.completedOrders}</span><strong>{data.completedOrders}</strong></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
