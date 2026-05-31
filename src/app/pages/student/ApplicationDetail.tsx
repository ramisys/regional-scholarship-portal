import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  MapPin,
  Paperclip,
  User,
  XCircle,
} from 'lucide-react';
import api, { handleApiError } from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingErrorState, PageLoader, SkeletonCard } from '../../components/loading';

interface EducationalBackground {
  id: string;
  school_name: string;
  level: string;
  year_started: number;
  year_ended: number | null;
}

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface StatusHistoryItem {
  id: string;
  old_status: string;
  new_status: string;
  changed_by_email: string;
  timestamp: string;
  notes: string;
}

interface Application {
  id: string;
  applicantName: string;
  email: string;
  region: string;
  title: string;
  personal_statement: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  is_draft: boolean;
  submittedDate: string;
  lastUpdated: string;
  educational_backgrounds: EducationalBackground[];
  documents: Document[];
  status_history: StatusHistoryItem[];
}

type ApiEnvelope<T> = {
  data?: T;
};

type ParsedStatement = {
  personalInfo?: Record<string, unknown>;
  contactInfo?: Record<string, unknown>;
};

export const ApplicationDetail: React.FC = () => {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const unwrapData = <T,>(responseData: T | ApiEnvelope<T>) => {
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return (responseData as ApiEnvelope<T>).data as T;
    }

    return responseData as T;
  };

  useEffect(() => {
    void fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    if (!applicationId) {
      setError('Missing application identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.get(`/applications/${applicationId}`);
      const applicationData = unwrapData<Application | unknown>(response.data);
      if (applicationData && typeof applicationData === 'object') {
        setApplication(applicationData as Application);
      } else {
        setApplication(null);
        setError('Unable to load application details.');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, isDraft: boolean) => {
    const variants: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    const label = isDraft ? 'Draft' : status.charAt(0).toUpperCase() + status.slice(1);

    return <Badge className={variants[isDraft ? 'draft' : status] || variants.pending}>{label}</Badge>;
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

  const parsedStatement = useMemo<ParsedStatement | null>(() => {
    if (!application?.personal_statement) {
      return null;
    }

    try {
      const parsed = JSON.parse(application.personal_statement);
      if (parsed && typeof parsed === 'object') {
        return parsed as ParsedStatement;
      }
    } catch {
      return null;
    }

    return null;
  }, [application?.personal_statement]);

  const personalInfoEntries = useMemo(() => {
    const personalInfo = parsedStatement?.personalInfo;
    if (!personalInfo || typeof personalInfo !== 'object') {
      return [];
    }

    return Object.entries(personalInfo)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([label, value]) => [label, String(value)] as const);
  }, [parsedStatement]);

  const contactInfoEntries = useMemo(() => {
    const contactInfo = parsedStatement?.contactInfo;
    if (!contactInfo || typeof contactInfo !== 'object') {
      return [];
    }

    return Object.entries(contactInfo)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([label, value]) => [label, String(value)] as const);
  }, [parsedStatement]);

  if (isLoading) {
    return (
      <PageLoader title="Loading application details" description="Fetching the full submission record">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SkeletonCard compact />
          <SkeletonCard compact />
          <SkeletonCard compact />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageLoader>
    );
  }

  if (error) {
    return (
      <LoadingErrorState
        title="Unable to load application"
        description={error}
        onRetry={() => {
          void fetchApplication();
        }}
      />
    );
  }

  if (!application) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Application not found"
        description="The application may have been removed or you may not have access to it."
        action={
          <Link to="/student/applications">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to applications
            </Button>
          </Link>
        }
      />
    );
  }

  const submittedDate = application.submittedDate ? new Date(application.submittedDate) : null;
  const updatedDate = application.lastUpdated ? new Date(application.lastUpdated) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link to="/student/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            {getStatusBadge(application.status, application.is_draft)}
          </div>
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">{application.title}</h1>
            <p className="text-gray-500">Review the full details of your scholarship submission</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {!application.is_draft && application.status !== 'draft' && (
            <Link to="/student/documents">
              <Button variant="outline">
                <Paperclip className="mr-2 h-4 w-4" />
                Manage Documents
              </Button>
            </Link>
          )}
          <Link to="/student/apply">
            <Button>Start New Application</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Applicant</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{application.applicantName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Region</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{application.region || 'Not provided'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {submittedDate ? submittedDate.toLocaleDateString() : 'Not submitted'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {updatedDate ? updatedDate.toLocaleDateString() : 'Not available'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Overview</CardTitle>
            <CardDescription>Submission details and profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  Applicant
                </div>
                <p className="mt-2 text-sm text-gray-600">{application.applicantName}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {application.email}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  Region
                </div>
                <p className="mt-2 text-sm text-gray-600">{application.region || 'Not provided'}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4" />
                  {submittedDate ? submittedDate.toLocaleString() : 'Not submitted'}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Personal Statement
              </h3>
              {parsedStatement ? (
                <div className="space-y-4">
                  {personalInfoEntries.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Personal Information</p>
                      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {personalInfoEntries.map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
                            <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                            <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {contactInfoEntries.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Contact Information</p>
                      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {contactInfoEntries.map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
                            <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                            <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                  {application.personal_statement || 'No personal statement provided.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
            <CardDescription>Recent updates on this application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(application.status)}
                <div>
                  <p className="font-medium text-gray-900">Current status</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {application.is_draft ? 'Draft' : application.status}
                  </p>
                </div>
              </div>

              {application.status_history.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-10 w-10" />}
                  title="No status history yet"
                  description="Status changes will appear here after review begins"
                />
              ) : (
                <div className="space-y-3">
                  {application.status_history
                    .slice()
                    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
                    .map((history) => (
                      <div key={history.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {history.old_status || 'submitted'} → {history.new_status}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Updated by {history.changed_by_email || 'system'}
                        </p>
                        {history.notes && <p className="mt-2 text-sm text-gray-600">{history.notes}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Education History</CardTitle>
            <CardDescription>Educational background submitted with the application</CardDescription>
          </CardHeader>
          <CardContent>
            {application.educational_backgrounds.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10" />}
                title="No education history provided"
                description="This application does not include any educational background entries"
              />
            ) : (
              <div className="space-y-3">
                {application.educational_backgrounds.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-gray-900">{item.school_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.level}</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {item.year_started}{item.year_ended ? ` - ${item.year_ended}` : ' - Present'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attached Documents</CardTitle>
            <CardDescription>Files uploaded with the application</CardDescription>
          </CardHeader>
          <CardContent>
            {application.documents.length === 0 ? (
              <EmptyState
                icon={<Paperclip className="h-10 w-10" />}
                title="No documents attached"
                description={application.is_draft || application.status === 'draft' ? 'Submit the application to unlock document uploads.' : 'Upload supporting files from the documents page'}
                action={
                  !application.is_draft && application.status !== 'draft' ? (
                    <Link to="/student/documents">
                      <Button variant="outline">Upload documents</Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {application.documents.map((document) => (
                  <a
                    key={document.id}
                    href={document.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{document.fileName}</p>
                      <p className="text-sm text-gray-500 capitalize">{document.fileType || 'document'}</p>
                    </div>
                    <Badge variant="outline">Open</Badge>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
