import { useMemo, useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useCurrency } from '../../components/CurrencyContext';

const AnalyticsCharts = ({ orders = [], products = [] }) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Small delay to ensure parent container (tabs/animations) has settled dimensions
        const timer = setTimeout(() => setIsReady(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const { currency, exchangeRate } = useCurrency(); // Convert data for charts

    // --- Data Processing ---

    // 1. Sales & Orders Over Time (Last 7 Days or All Time grouped by Date)
    const salesData = useMemo(() => {
        const datedMap = {};
        if (!Array.isArray(orders)) return [];

        orders.forEach(order => {
            if (!order || !order.date) return;
            const date = new Date(order.date).toLocaleDateString();
            if (!datedMap[date]) datedMap[date] = { date, fullDate: order.date, sales: 0, orders: 0 };

            // Convert value if LKR
            let orderTotal = order.total || 0;
            if (currency === 'LKR') orderTotal *= exchangeRate;

            datedMap[date].sales += orderTotal;
            datedMap[date].orders += 1;
        });

        // Sort by date using the timestamp
        return Object.values(datedMap)
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
            .slice(-7);
    }, [orders, currency, exchangeRate]);

    // 2. Order Status Distribution
    const statusData = useMemo(() => {
        const counts = {};
        if (!Array.isArray(orders)) return [];

        orders.forEach(o => {
            if (!o || !o.status) return;
            counts[o.status] = (counts[o.status] || 0) + 1;
        });
        return Object.keys(counts).map(status => ({ name: status, value: counts[status] }));
    }, [orders]);

    // 3. Category Performance (Revenue)
    const categoryData = useMemo(() => {
        const catMap = {};
        if (!Array.isArray(orders)) return [];

        orders.forEach(order => {
            if (!order || !Array.isArray(order.items)) return;
            order.items.forEach(item => {
                if (!item) return;
                const category = item.category || 'Apparel';
                if (!catMap[category]) catMap[category] = 0;

                let itemTotal = (item.price || 0) * (item.quantity || 1);
                if (currency === 'LKR') itemTotal *= exchangeRate;

                catMap[category] += itemTotal;
            });
        });
        return Object.keys(catMap).map(cat => ({ name: cat, revenue: catMap[cat] }));
    }, [orders, currency, exchangeRate]);

    // Colors for Charts
    const COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];
    const currencySymbol = currency === 'LKR' ? 'Rs. ' : '$';

    if (!isReady) {
        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-transparent h-[400px] flex items-center justify-center">
                    <span className="text-gray-400 animate-pulse">Loading analytics...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Row 1: Sales Trend */}
            <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-transparent">
                <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Revenue Trend (Last 7 Active Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                            <Area type="monotone" dataKey="sales" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Status & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Orders by Status */}
                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-transparent">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Order Status</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => {
                                        let color = '#8884d8';
                                        switch (entry.name) {
                                            case 'Pending': color = '#F97316'; break; // Orange (was Blue)
                                            case 'Processing': color = '#3B82F6'; break; // Blue (was Orange)
                                            case 'Hand on Courier': color = '#8B5CF6'; break; // Purple
                                            case 'Shipped': color = '#6366F1'; break; // Indigo
                                            case 'Delivered': color = '#10B981'; break; // Green
                                            case 'Cancelled': color = '#EF4444'; break; // Red
                                            default: color = COLORS[index % COLORS.length];
                                        }
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-transparent">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Sales by Category</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsCharts;
