import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Clock, CheckCircle, XCircle, Eye, Search } from 'lucide-react';

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
    fetchApplications();
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
    try {
      const response = await api.get('/student/applications');
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
    const steps = [
      { label: 'Submitted', active: true },
      { label: 'Under Review', active: status !== 'pending' },
      { label: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Decision', active: status !== 'pending' },
    ];

    return steps;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor the status of your scholarship applications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-48">
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
        </CardContent>
      </Card>

      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No applications found</p>
            <Link to="/student/apply">
              <Button>Create New Application</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {getStatusIcon(application.status)}
                      {application.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Submitted on {new Date(application.submittedDate).toLocaleDateString()} • Region: {application.region}
                    </CardDescription>
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
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {getProgressSteps(application.status).map((step, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <p className={`text-sm mt-2 ${step.active ? 'font-medium' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                      </div>
                      {index < getProgressSteps(application.status).length - 1 && (
                        <div className={`flex-1 h-1 ${step.active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Last updated: {new Date(application.lastUpdated).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
