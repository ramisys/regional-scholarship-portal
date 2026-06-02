import React, { useEffect, useState } from 'react';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';

const severities = ["INFO", "WARNING", "CRITICAL"];
const categories = ["AUTHENTICATION", "APPLICATION", "DOCUMENT", "SECURITY", "ADMINISTRATION"];

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    void fetchLogs();
  }, [search, severity, category, page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.action_type = search;
      if (severity && severity !== 'all') params.severity = severity;
      if (category && category !== 'all') params.category = category;
      const res = await api.get('/core/audit-logs/', { params });
      const data = res.data || {};
      setLogs(data.results || []);
      setTotalCount(typeof data.count === 'number' ? data.count : null);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeClass = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-gray-500">View immutable audit trails for the system (coordinators only)</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex gap-3 flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 w-full">
              <Input placeholder="Action type or search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {severities.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600">{error}</div>}
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l: any) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelected(l)}>
                    <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{l.user?.email ?? 'System'}</TableCell>
                    <TableCell>{l.action_type}</TableCell>
                    <TableCell>{l.action_category}</TableCell>
                    <TableCell><Badge className={getBadgeClass(l.severity_level)}>{l.severity_level}</Badge></TableCell>
                    <TableCell>{l.resource_type ? `${l.resource_type}#${l.resource_id}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{totalCount !== null ? `${totalCount} total` : ''}</div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrev || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="px-3 py-1 text-sm text-gray-700">Page {page}</div>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Entry</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div><strong>Time:</strong> {new Date(selected.timestamp).toLocaleString()}</div>
              <div><strong>User:</strong> {selected.user?.email ?? 'System'}</div>
              <div><strong>Action:</strong> {selected.action_type}</div>
              <div><strong>Category:</strong> {selected.action_category}</div>
              <div><strong>Description:</strong> {selected.description}</div>
              <div><strong>Endpoint:</strong> {selected.endpoint}</div>
              <div><strong>IP:</strong> {selected.ip_address}</div>
              <div><strong>Old:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(selected.old_value, null, 2)}</pre></div>
              <div><strong>New:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(selected.new_value, null, 2)}</pre></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
