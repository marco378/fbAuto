"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import Sidebar from "../components/Sidebar";
import { Montserrat } from "next/font/google";

const monte = Montserrat({ subsets: ['latin'] });

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    jobs: { total: 0 },
    candidates: [],
    recentJobs: []
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get("/auth/profile");
        setUser(response.data);
        await fetchDashboardData();
      } catch (error) {
        console.error("Authentication failed:", error);
        router.push("/auth/login");
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      
      // Fetch jobs data
      const [jobsResponse, candidatesResponse] = await Promise.all([
        axiosInstance.get("/jobs?limit=5"),
        axiosInstance.get("/candidates")
      ]);

      const jobs = jobsResponse.data.jobs || [];
      const candidates = candidatesResponse.data.data || [];

      // Calculate job statistics
      const jobStats = {
        total: jobs.length,
        active: jobs.filter(job => job.isActive).length,
        posted: jobs.filter(job => job.postingStatus && job.postingStatus.posted > 0).length,
        pending: jobs.filter(job => job.postingStatus && job.postingStatus.pending > 0).length
      };

      // Calculate analytics from jobs
      const analytics = jobs.reduce((acc, job) => {
        job.posts?.forEach(post => {
          acc.totalViews += post.metrics?.views || 0;
          acc.totalComments += post.comments?.length || 0;
          acc.interestedCandidates += post.comments?.filter(c => c.isInterested)?.length || 0;
        });
        return acc;
      }, { totalViews: 0, totalComments: 0, interestedCandidates: 0 });

      setDashboardData({
        jobs: jobStats,
        candidates: candidates.slice(0, 5), // Show only top 5 candidates
        recentJobs: jobs.slice(0, 3), // Show only recent 3 jobs
        analytics
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getJobStatusColor = (job) => {
    if (!job.postingStatus) return 'bg-gray-100 text-gray-600';
    if (job.postingStatus.posted > 0) return 'bg-green-100 text-green-600';
    if (job.postingStatus.posting > 0) return 'bg-yellow-100 text-yellow-600';
    if (job.postingStatus.failed > 0) return 'bg-red-100 text-red-600';
    return 'bg-blue-100 text-blue-600';
  };

  const getJobStatusText = (job) => {
    if (!job.postingStatus) return 'Not Posted';
    if (job.postingStatus.posted > 0) return 'Posted';
    if (job.postingStatus.posting > 0) return 'Posting';
    if (job.postingStatus.failed > 0) return 'Failed';
    return 'Pending';
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black"></div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${monte.className}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Welcome back! 🎉</h1>
            <p className="text-gray-600 text-lg">Here's your recruitment dashboard overview</p>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                      <p className="text-2xl font-bold text-black">{dashboardData.jobs.total}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6.5" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {dashboardData.jobs.active} active jobs
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posted Jobs</p>
                      <p className="text-2xl font-bold text-green-600">{dashboardData.jobs.posted}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {dashboardData.jobs.pending} pending
                  </p>
                </div>

                {/* <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-purple-600">{dashboardData.analytics.totalViews}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {dashboardData.analytics.totalComments} total comments
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Interested Candidates</p>
                      <p className="text-2xl font-bold text-orange-600">{dashboardData.analytics.interestedCandidates}</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-100">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    From {dashboardData.candidates.length} total candidates
                  </p>
                </div> */}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Jobs */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-black">Recent Jobs</h3>
                  </div>
                  <div className="p-6">
                    {dashboardData.recentJobs.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <h4 className="font-medium text-black">{job.title}</h4>
                              <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                              <p className="text-xs text-gray-500 mt-1">Created {formatDate(job.createdAt)}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job)}`}>
                                {getJobStatusText(job)}
                              </span>
                              {job.postingStatus && (
                                <span className="text-sm text-gray-500">
                                  {job.postingStatus.posted}/{job.facebookGroups?.length || 0} posted
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6.5" />
                        </svg>
                        <p className="text-gray-500 mt-2">No jobs created yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Candidates */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-black">Recent Candidates</h3>
                  </div>
                  <div className="p-6">
                    {dashboardData.candidates.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.candidates.map((candidate) => (
                          <div key={candidate.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">{candidate.name || 'N/A'}</p>
                              {candidate.phoneNumber && (
                                <p className="text-xs text-gray-600">{candidate.phoneNumber}</p>
                              )}
                              {candidate.email && (
                                <p className="text-xs text-gray-600 truncate">{candidate.email}</p>
                              )}
                              {candidate.screeningScore && (
                                <div className="mt-1">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    candidate.screeningScore >= 8 ? 'bg-green-100 text-green-800' :
                                    candidate.screeningScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    Score: {candidate.screeningScore}/10
                                  </span>
                                </div>
                              )}
                              {candidate.eligibility && (
                                <div className="mt-1">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    candidate.eligibility === 'ELIGIBLE' ? 'bg-green-100 text-green-800' :
                                    candidate.eligibility === 'NOT_ELIGIBLE' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {candidate.eligibility.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 mt-2">No candidates yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}