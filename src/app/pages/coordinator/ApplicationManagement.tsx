import React, { useEffect, useState } from 'react';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Filter, Search, Eye, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { ButtonLoader, LoadingErrorState, PageLoader, SkeletonCard, SkeletonTable } from '../../components/loading';

interface Application {
  id: string;
  applicantName: string;
  email: string;
  region: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: Document[];
}

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export const ApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMissingDocsModal, setShowMissingDocsModal] = useState(false);
  const [selectedMissingDocs, setSelectedMissingDocs] = useState<string[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const documentTypes = [
    { value: 'id_card', label: 'ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'transcript', label: 'Transcript' },
    { value: 'other', label: 'Other Documents' },
  ];

  useEffect(() => {
    void fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, regionFilter, statusFilter, applications]);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/dashboard/applications');
      const applicationsData = response.data?.data ?? [];
      setApplications(applicationsData);
      setFilteredApplications(applicationsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter((app) => app.region === regionFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleApprove = async (applicationId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/dashboard/applications/${applicationId}/status`, {
        status: 'approved',
        notes: 'Application approved by coordinator',
      });
      toast.success('Application approved successfully');
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: 'approved' as const } : app
        )
      );
      setShowDetailsModal(false);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/dashboard/applications/${applicationId}/status`, {
        status: 'rejected',
        notes: 'Application rejected by coordinator',
      });
      toast.success('Application rejected');
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: 'rejected' as const } : app
        )
      );
      setShowDetailsModal(false);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotifyMissingDocuments = async () => {
    if (!selectedApplication || selectedMissingDocs.length === 0) {
      toast.error('Please select at least one missing document');
      return;
    }

    setNotificationLoading(true);
    try {
      await api.post(`/dashboard/applications/${selectedApplication.id}/notify-missing-documents`, {
        missing_documents: selectedMissingDocs,
      });
      toast.success('Student notified about missing documents');
      setShowMissingDocsModal(false);
      setSelectedMissingDocs([]);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setNotificationLoading(false);
    }
  };

  const toggleDocumentSelection = (docType: string) => {
    setSelectedMissingDocs((prev) =>
      prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]
    );
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

  const uniqueRegions = Array.from(new Set(applications.map((app) => app.region)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-gray-900 text-2xl font-semibold">Application Management</h1>
        <p className="text-gray-500">Review and manage scholarship applications</p>
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
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Search and filter scholarship applications</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="sm:w-48" disabled={isLoading}>
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <CardContent className="p-0">
          {isLoading ? (
            <PageLoader title="Loading applications" description="Fetching review queue and filters">
              <SkeletonTable columns={6} rows={5} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <SkeletonCard compact />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <SkeletonCard compact />
                </div>
              </div>
            </PageLoader>
          ) : filteredApplications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Filter className="h-12 w-12" />}
                title="No applications found"
                description="Try adjusting your search or filter criteria"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.applicantName}</TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>{application.region}</TableCell>
                    <TableCell>
                      {new Date(application.submittedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review application information and documents
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Applicant Name</p>
                  <p className="font-medium">{selectedApplication.applicantName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Region</p>
                  <p className="font-medium">{selectedApplication.region}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted Date</p>
                  <p className="font-medium">
                    {new Date(selectedApplication.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Uploaded Documents</h4>
                {(selectedApplication.documents ?? []).length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-10 w-10" />}
                    title="No documents uploaded"
                    description="This application has no files attached"
                  />
                ) : (
                  <div className="space-y-2">
                    {(selectedApplication.documents ?? []).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedApplication?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedMissingDocs([]);
                    setShowMissingDocsModal(true);
                  }}
                  disabled={actionLoading || notificationLoading}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Notify Missing Docs
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedApplication.id)}
                  disabled={actionLoading}
                >
                  <ButtonLoader isLoading={actionLoading} loadingLabel="Rejecting...">
                    <span className="inline-flex items-center">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </span>
                  </ButtonLoader>
                </Button>
                <Button
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={actionLoading}
                >
                  <ButtonLoader isLoading={actionLoading} loadingLabel="Approving...">
                    <span className="inline-flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </span>
                  </ButtonLoader>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissingDocsModal} onOpenChange={setShowMissingDocsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify About Missing Documents</DialogTitle>
            <DialogDescription>
              Select which documents are missing and the student will be notified via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {documentTypes.map((docType) => (
              <div key={docType.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={docType.value}
                  checked={selectedMissingDocs.includes(docType.value)}
                  onChange={() => toggleDocumentSelection(docType.value)}
                  className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
                />
                <label
                  htmlFor={docType.value}
                  className="text-sm font-medium cursor-pointer text-gray-700"
                >
                  {docType.label}
                </label>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMissingDocsModal(false)}
              disabled={notificationLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNotifyMissingDocuments}
              disabled={selectedMissingDocs.length === 0}
            >
              <ButtonLoader isLoading={notificationLoading} loadingLabel="Sending...">
                <span className="inline-flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Send Notification
                </span>
              </ButtonLoader>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
