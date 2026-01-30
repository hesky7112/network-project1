import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, User, MoreHorizontal, Activity, Loader2, Edit2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { GlassWrapper } from '@/components/ui/motion-container';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type Operator = {
  id: string;
  username: string;
  email: string;
  role: string;
  status?: string;
};

export default function OperatorIndex() {
  useAuth();
  const mounted = useMounted();
  const [users, setUsers] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Operator | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.getUsers();
      setUsers(resp);
    } catch (err) {
      toast.error("Failed to fetch operators");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) fetchUsers();
  }, [mounted]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update
        // Note: API might only support role update via this endpoint structure or generic update
        // Assuming update user endpoint exists or we use specific one
        // Using generic update:
        await apiClient.updateUser(parseInt(editingUser.id), { role: newUser.role });
        toast.success("Node permissions re-calibrated");
      } else {
        // Create
        await apiClient.createUser(newUser);
        toast.success("New node provisioned to matrix");
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setNewUser({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (err) {
      toast.error(editingUser ? "Recalibration failed" : "Provisioning failed");
      console.error(err);
    }
  };

  const columns: ColumnDef<Operator>[] = [
    {
      accessorKey: 'username',
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node_Identity</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-slate-400" style={{ borderRadius: '1.5px' }}>
            <User className="h-4 w-4" />
          </div>
          <div className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.username}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comm_Link</span>
      ),
      cell: ({ row }) => (
        <span className="text-[10px] font-bold text-slate-400 font-mono italic">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access_Tier</span>
      ),
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest",
          row.original.role === 'admin' || row.original.role === 'Super Admin' ? "border-earth-green/30 bg-earth-green/10 text-earth-green" :
            "border-stardust-violet/30 bg-stardust-violet/10 text-stardust-violet"
        )} style={{ borderRadius: '1px' }}>
          {row.original.role}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 border border-white/5 hover:border-white/20 hover:bg-white/5"
            onClick={() => {
              setEditingUser(row.original);
              setNewUser({
                username: row.original.username,
                email: row.original.email,
                password: '', // Password placeholder or empty
                role: row.original.role
              });
              setIsModalOpen(true);
            }}
          >
            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 border border-white/5 hover:border-white/20 hover:bg-white/5"
            onClick={async () => {
              if (confirm(`Purge user ${row.original.username}?`)) {
                try {
                  await apiClient.deleteUser(parseInt(row.original.id));
                  toast.success("User purged from matrix");
                  fetchUsers();
                } catch (e) {
                  toast.error("Purge failed");
                }
              }
            }}
          >
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (!mounted) return null;

  return (
    <Layout title="Operator_Index">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />

        {/* HUD Header */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                  <User className="h-6 w-6 text-stardust-violet" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Operator_Index</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Authorized_Personnel_Heuristic_Index</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingUser(null);
                setNewUser({ username: '', email: '', password: '', role: 'viewer' });
                setIsModalOpen(true);
              }}
              className="bg-earth-green/80 hover:bg-earth-green text-black text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]"
            >
              <Plus className="mr-3 h-4 w-4" />
              PROVISION_NEW_NODE
            </Button>
          </div>

          {/* Filters HUD */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-white/5 gap-6">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-stardust-violet transition-colors" />
              <input
                type="search"
                placeholder="PROBE_OPERATORS..."
                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-stardust-violet/30 transition-all rounded-sm"
              />
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none bg-white/5 border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest h-11 px-6 hover:bg-white/10 hover:border-white/20 rounded-sm transition-all">
                <Filter className="mr-2 h-3.5 w-3.5" />
                FILTER_PARAMS
              </Button>
              <div className="h-6 w-[1px] bg-white/10 hidden sm:block mx-2" />
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-earth-green" />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sync_Status: <span className="text-white">{loading ? 'SYNCING...' : '100%'}</span></div>
              </div>
            </div>
          </div>
        </GlassWrapper>

        {/* Data Matrix */}
        <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 min-h-[400px] flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-stardust-violet animate-spin" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Retrieving_Node_Matrix...</span>
            </div>
          ) : (
            <div className="alien-net-table overflow-x-auto w-full">
              <DataTable columns={columns} data={users} />
            </div>
          )}
        </GlassWrapper>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-8 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-earth-green/30" />
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">{editingUser ? 'RECONFIGURE_NODE' : 'PROVISION_OPERATOR'}</h2>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">{editingUser ? 'Modifying_Auth_Parameters' : 'Initializing_New_Auth_Node'}</p>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Callsign</label>
                  <input
                    required
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-earth-green/30 transition-all rounded-sm italic"
                    placeholder="OPERATOR_X"
                    disabled={!!editingUser} // Username usually immutable
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Comm_Link_Primary</label>
                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-earth-green/30 transition-all rounded-sm italic"
                    placeholder="NODE@ALIEN.NET"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Auth_Key_Cipher</label>
                  <input
                    required
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-earth-green/30 transition-all rounded-sm italic"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Authorization_Tier</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-earth-green/30 transition-all rounded-sm italic"
                  >
                    <option value="viewer" className="bg-[#0a0a0c]">L_05 (VIEWER)</option>
                    <option value="editor" className="bg-[#0a0a0c]">L_03 (OPERATOR)</option>
                    <option value="admin" className="bg-[#0a0a0c]">L_01 (ADMIN)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5"
                  >
                    ABORT
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-earth-green text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-[#00dd38] transition-all"
                  >
                    {editingUser ? 'UPDATE_NODE' : 'INITIATE'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
