import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coordinator Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-gray-500 mt-1">Today's approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedToday}</div>
            <p className="text-xs text-gray-500 mt-1">Today's rejections</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Applications by Region</CardTitle>
            <CardDescription>Regional distribution of applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.applicationsByRegion?.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.applicationsByRegion?.map((item) => (
                  <div key={item.region} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{item.region}</span>
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
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest submissions requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent applications</p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-start justify-between pb-3 border-b last:border-0">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{app.applicantName}</p>
                        <p className="text-sm text-gray-500">{app.region}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(app.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link to="/coordinator/applications">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
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
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link to="/coordinator/applications?status=pending">
            <Button variant="outline" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Review Pending Applications
            </Button>
          </Link>
          <Link to="/coordinator/applications?status=approved">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle className="mr-2 h-4 w-4" />
              View Approved Applications
            </Button>
          </Link>
          <Link to="/coordinator/applications">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              All Applications
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
