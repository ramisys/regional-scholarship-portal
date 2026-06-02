import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Clock, CheckCircle, XCircle, Eye, Search, FileText } from 'lucide-react';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingErrorState, PageLoader, SkeletonCard, SkeletonTable } from '../../components/loading';

interface Application {
  id: string;
  title: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  region: string;
  lastUpdated: string;
}

type ApiEnvelope<T> = {
  data?: T;
};

export const ApplicationTracking: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    void fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const unwrapData = <T,>(responseData: T | ApiEnvelope<T>) => {
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return (responseData as ApiEnvelope<T>).data as T;
    }

    return responseData as T;
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/student/applications/');
      const applicationsData = unwrapData<Application[] | unknown>(response.data);
      const list = Array.isArray(applicationsData) ? applicationsData : [];
      setApplications(list);
      setFilteredApplications(list);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter((app) =>
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    return (
      <Badge className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgressSteps = (status: string) => {
    return [
      { label: 'Submitted' },
      { label: 'Under Review' },
      {
        label:
          status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Decision',
      },
    ];
  };

  const getCurrentStep = (status: string) => {
    return status === 'pending' ? 0 : 2;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-gray-900 text-2xl font-semibold">My Applications</h1>
        <p className="text-gray-500">Monitor the status of your scholarship applications</p>
      </div>

      {error && (
        <LoadingErrorState
          title="Unable to load applications"
          description={error}
          onRetry={() => {
            void fetchApplications();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Applications History</CardTitle>
              <CardDescription>Search and filter your applications</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-48" disabled={isLoading}>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader title="Loading applications" description="Fetching your applications and timeline">
              <SkeletonTable columns={6} rows={4} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SkeletonCard compact />
                <SkeletonCard compact />
              </div>
            </PageLoader>
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title={searchTerm || statusFilter !== 'all' ? 'No applications found' : 'No applications yet'}
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Your applications will appear here once you submit them'
              }
              action={
                <Link to="/student/apply">
                  <Button>Create New Application</Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{application.title}</p>
                        <p className="text-xs text-gray-500">#{application.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-600">
                        {new Date(application.submittedDate).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-600">{application.region}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      <p className="text-gray-600">
                        {new Date(application.lastUpdated).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/student/applications/${application.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && filteredApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
            <CardDescription>Recent updates on your applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(application.status)}
                    <div>
                      <p className="font-medium text-gray-900">{application.title}</p>
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(application.submittedDate).toLocaleDateString()} • {application.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(application.status)}
                    <Link to={`/student/applications/${application.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressIndicator
                    steps={getProgressSteps(application.status)}
                    currentStep={getCurrentStep(application.status)}
                  />
                  <p className="text-sm text-gray-500 mt-3">
                    Last updated: {new Date(application.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
