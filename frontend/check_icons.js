const lucide = require('lucide-react');
const iconsToCheck = [
    'Network', 'Shield', 'BarChart2', 'BarChart3', 'Settings', 'Zap', 'ArrowRight',
    'CheckCircle', 'Check', 'Activity', 'AlertTriangle', 'Server', 'LayoutDashboard',
    'Users', 'Search', 'Bell', 'LogOut', 'Menu', 'X', 'TrendingUp', 'TrendingDown',
    'Clock', 'Wifi', 'Globe', 'Cpu', 'HardDrive', 'RefreshCw', 'Eye', 'ChevronRight',
    'AlertCircle', 'FileText', 'MessageSquare', 'Sun', 'Moon', 'Download', 'Plus',
    'Filter', 'MoreHorizontal', 'Edit', 'Trash2', 'XCircle', 'PieChart', 'LineChart',
    'AreaChart', 'Database', 'Terminal', 'UserPlus', 'Lock', 'ZapOff', 'Box',
    'Layers', 'Radio', 'GitBranch', 'ShieldCheck', 'Save', 'AlertOctagon', 'Info',
    'CheckCircle2', 'Book', 'Code', 'Building', 'Briefcase', 'DollarSign', 'Award',
    'Github', 'ShoppingCart', 'Wallet', 'Smartphone', 'Send', 'Upload', 'Settings2',
    'Link2', 'Star', 'Package', 'ShieldAlert'
];

iconsToCheck.forEach(icon => {
    if (!lucide[icon]) {
        console.log(`MISSING ICON: ${icon}`);
    }
});
console.log('Verification Complete');
