import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FileText, Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingErrorState, PageLoader, SkeletonCard } from '../../components/loading';

interface CoordinatorStats {
  totalApplications: number;
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  applicationsByRegion: { region: string; count: number }[];
}

interface RecentApplication {
  id: string;
  applicantName: string;
  region: string;
  submittedDate: string;
  status: string;
}

const normalizeStats = (stats: Partial<CoordinatorStats> | undefined | null): CoordinatorStats => ({
  totalApplications: stats?.totalApplications ?? 0,
  pendingReview: stats?.pendingReview ?? 0,
  approvedToday: stats?.approvedToday ?? 0,
  rejectedToday: stats?.rejectedToday ?? 0,
  applicationsByRegion: stats?.applicationsByRegion ?? [],
});

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CoordinatorStats>({
    totalApplications: 0,
    pendingReview: 0,
    approvedToday: 0,
    rejectedToday: 0,
    applicationsByRegion: [],
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [statsResponse, applicationsResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-applications'),
      ]);

      setStats(normalizeStats(statsResponse.data?.data));
      setRecentApplications(applicationsResponse.data?.data ?? []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      helper: 'All time',
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      helper: 'Awaiting action',
    },
    {
      title: 'Approved Today',
      value: stats.approvedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      helper: "Today's approvals",
    },
    {
      title: 'Rejected Today',
      value: stats.rejectedToday,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      helper: "Today's rejections",
    },
  ];

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

  if (isLoading) {
    return (
      <PageLoader title="Loading coordinator dashboard" description="Fetching review metrics and recent applications">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} compact />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageLoader>
    );
  }

  if (error) {
    return (
      <LoadingErrorState
        title="Unable to load dashboard"
        description={error}
        onRetry={() => {
          void fetchDashboardData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-gray-900 text-2xl font-semibold">Coordinator Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.firstName}!</p>
        </div>
        <Link to="/coordinator/applications">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            View All Applications
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.helper}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Applications by Region</CardTitle>
            <CardDescription>Regional distribution of applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.applicationsByRegion?.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12" />}
                title="No regional data yet"
                description="Regional application distribution will appear here"
              />
            ) : (
              <div className="space-y-3">
                {stats.applicationsByRegion?.map((item) => (
                  <div
                    key={item.region}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">{item.region}</span>
                    </div>
                    <span className="text-gray-600">{item.count} applications</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest submissions requiring review</CardDescription>
              </div>
              <Link to="/coordinator/applications" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No recent applications"
                description="New submissions will appear here"
              />
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{app.applicantName}</p>
                        <p className="text-sm text-gray-500">{app.region}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(app.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                      <Link to="/coordinator/applications">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage scholarship applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/coordinator/applications?status=pending">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                <Clock className="h-8 w-8 text-gray-400 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Review Pending</h4>
                <p className="text-sm text-gray-500">Focus on awaiting decisions</p>
              </div>
            </Link>
            <Link to="/coordinator/applications?status=approved">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                <CheckCircle className="h-8 w-8 text-gray-400 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Approved Applications</h4>
                <p className="text-sm text-gray-500">Review completed approvals</p>
              </div>
            </Link>
            <Link to="/coordinator/applications">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">All Applications</h4>
                <p className="text-sm text-gray-500">Manage every submission</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
