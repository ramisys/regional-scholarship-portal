import React, { useEffect, useState } from 'react';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { FileText, X } from 'lucide-react';
import { FileUploader } from '../../components/common/FileUploader';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingErrorState, PageLoader, SkeletonCard, UploadProgressLoader } from '../../components/loading';

interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface StudentApplication {
  id: string;
  title: string;
  status: string;
  is_draft?: boolean;
}

type ApiEnvelope<T> = {
  data?: T;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [applicationTitle, setApplicationTitle] = useState('');
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [applicationError, setApplicationError] = useState('');

  const unwrapData = <T,>(responseData: T | ApiEnvelope<T>) => {
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return (responseData as ApiEnvelope<T>).data as T;
    }

    return responseData as T;
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  useEffect(() => {
    if (activeApplicationId && hasSubmittedApplication) {
      void fetchDocuments(activeApplicationId);
    }
  }, [activeApplicationId, hasSubmittedApplication]);

  const fetchApplications = async () => {
    setLoadingApplication(true);
    setApplicationError('');

    try {
      const response = await api.get('/student/applications/');
      const applicationsData = unwrapData<StudentApplication[] | unknown>(response.data);
      const list = Array.isArray(applicationsData) ? applicationsData : [];
      const submittedApplications = list.filter((application) => application?.is_draft === false && application?.status !== 'draft');
      const latestApplication = submittedApplications[submittedApplications.length - 1];

      if (latestApplication?.id) {
        setActiveApplicationId(String(latestApplication.id));
        setApplicationTitle(latestApplication.title || 'your latest application');
        setHasSubmittedApplication(true);
      } else {
        setActiveApplicationId(null);
        setApplicationTitle('');
        setHasSubmittedApplication(false);
      }
    } catch (err) {
      const message = handleApiError(err);
      setApplicationError(message);
      toast.error(message);
    } finally {
      setLoadingApplication(false);
    }
  };

  const fetchDocuments = async (applicationId: string) => {
    setLoadingDocuments(true);

    try {
      const response = await api.get(`/documents/application/${applicationId}`);
      const documentsData = unwrapData<any[]>(response.data);
      const documentsList = Array.isArray(documentsData) ? documentsData : [];

      const mappedDocuments = documentsList.map((doc) => ({
        id: String(doc.id),
        fileName: doc.file.split('/').pop() || 'document',
        fileSize: 0,
        fileType: 'application/pdf',
        uploadDate: doc.uploaded_at,
        status: 'pending' as const,
      }));

      setDocuments(mappedDocuments);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!activeApplicationId || !hasSubmittedApplication) {
      toast.error('Submit your application before uploading documents.');
      return;
    }

    const formData = new FormData();
    formData.append('application', activeApplicationId);
    formData.append('document_type', 'other');
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      toast.success('Document uploaded successfully!');
      
      // Refresh documents list after upload
      await fetchDocuments(activeApplicationId);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (loadingApplication) {
      toast.error('Loading your application details. Please wait.');
      return;
    }

    if (!activeApplicationId) {
      toast.error('Submit your application before uploading documents.');
      return;
    }

    if (uploading) {
      toast.error('Please wait for the current upload to finish.');
      return;
    }

    if (files[0]) {
      uploadFile(files[0]);
    }
  };

  const handleDelete = async (documentId: string) => {
    setDocuments((prev: UploadedDocument[]) => prev.filter((doc: UploadedDocument) => doc.id !== documentId));
    toast.success('Document removed from the list');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="mb-1 text-gray-900 text-2xl font-semibold">Document Upload</h1>
        <p className="text-gray-500">Upload your KYC and supporting documents</p>
        {!loadingApplication && activeApplicationId && (
          <p className="text-sm text-gray-500 mt-2">
            Documents can now be attached to {applicationTitle || 'your submitted application'}.
          </p>
        )}
        {!loadingApplication && !activeApplicationId && (
          <p className="text-sm text-amber-600 mt-2">
            Submit a scholarship application before uploading documents.
          </p>
        )}
      </div>

      {loadingApplication ? (
        <PageLoader title="Loading document workspace" description="Checking your latest application">
          <SkeletonCard />
          <SkeletonCard />
        </PageLoader>
      ) : applicationError ? (
        <LoadingErrorState
          title="Unable to load application"
          description={applicationError}
          onRetry={() => {
            void fetchApplications();
          }}
        />
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Accepted formats: PDF, JPEG, PNG (Max size: 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            onFileSelect={handleFilesSelected}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={MAX_FILE_SIZE}
            multiple={false}
            disabled={uploading || loadingApplication || !hasSubmittedApplication}
          />

          {!loadingApplication && !hasSubmittedApplication && (
            <p className="mt-3 text-sm text-amber-600">
              Uploading documents is available only after you submit an application.
            </p>
          )}

          {uploading && (
            <div className="mt-4">
              <UploadProgressLoader progress={uploadProgress} statusText="Uploading document" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>Manage your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48 max-w-full" />
                      <Skeleton className="h-3 w-64 max-w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No documents uploaded yet"
              description="Upload your first document to get started"
            />
          ) : (
            <div className="space-y-3">
              {documents.map((doc: UploadedDocument) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(doc.fileSize / 1024).toFixed(2)} KB • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      className={
                        doc.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
