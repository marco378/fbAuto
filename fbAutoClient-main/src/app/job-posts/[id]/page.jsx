"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Building, Briefcase, Users, Calendar, Send, BarChart3, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../../components/Sidebar";

export default function SingleJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId;
  
  const [job, setJob] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const fetchJob = async () => {
    try {
      console.log("Fetching job with ID:", jobId);
      const res = await axiosInstance.get(`/jobs/${jobId}`);
      console.log("Job data received:", res.data);
      setJob(res.data.job);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch job:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.error || "Failed to load job details");
    }
  };

  const fetchAnalytics = async () => {
    try {
      console.log("Fetching analytics for job ID:", jobId);
      const res = await axiosInstance.get(`/jobs/${jobId}/analytics`);
      console.log("Analytics data received:", res.data);
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      // Don't set error state for analytics failure, it's optional
    }
  };

  useEffect(() => {
    console.log("useParams result:", params);
    console.log("jobId extracted:", jobId);
    
    if (jobId) {
      const loadData = async () => {
        setLoading(true);
        try {
          await fetchJob();
          await fetchAnalytics();
        } catch (err) {
          console.error("Error loading job data:", err);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    } else {
      setLoading(false);
      setError(`No job ID provided. Params: ${JSON.stringify(params)}`);
    }
  }, [jobId, params]);

  const handlePostToFacebook = async () => {
    try {
      setPosting(true);
      await axiosInstance.post(`/jobs/${jobId}/post-to-facebook`);
      // Refresh job data to see updated posting status
      await fetchJob();
      await fetchAnalytics();
      alert("Job posted successfully!");
    } catch (err) {
      console.error("Failed to post to Facebook:", err);
      alert(err.response?.data?.error || "Failed to post to Facebook groups. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'POSTING': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle size={16} />;
      case 'FAILED': return <XCircle size={16} />;
      case 'PENDING': return <AlertCircle size={16} />;
      case 'POSTING': return <Clock size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchJob();
      await fetchAnalytics();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black mx-auto mb-4"></div>
            <div className="text-black">Loading job details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4 text-lg">{error || "Job not found"}</div>
            <div className="space-x-3">
              <button
                onClick={() => router.push("/job-posts")}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Back to Jobs
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/job-posts")}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Jobs
              </button>
              <div>
                <h1 className="text-3xl font-bold text-black">{job.title}</h1>
                <div className="flex items-center gap-4 text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Building size={16} />
                    {job.company}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              {job.facebookGroups && job.facebookGroups.length > 0 && (
                <button
                  onClick={handlePostToFacebook}
                  disabled={posting}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {posting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Post to Facebook
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">Job Details</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    job.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Job Type</label>
                    <div className="flex items-center gap-2 text-black">
                      <Briefcase size={16} />
                      {job.jobType}
                    </div>
                  </div>
                  {job.experiance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Experience</label>
                      <div className="flex items-center gap-2 text-black">
                        <Users size={16} />
                        {job.experiance}
                      </div>
                    </div>
                  )}
                  {job.salaryRange && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Salary Range</label>
                      <div className="text-black font-medium">💰 {job.salaryRange}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-black mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">Requirements</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.responsibities && job.responsibities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">Responsibilities</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {job.responsibities.map((resp, index) => (
                          <li key={index}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.perks && (
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">Perks & Benefits</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.perks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Facebook Groups */}
              {job.facebookGroups && job.facebookGroups.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-black mb-4">Facebook Groups ({job.facebookGroups.length})</h2>
                  <div className="space-y-3">
                    {job.facebookGroups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 truncate flex-1 mr-3">{group}</span>
                        <a
                          href={group}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                        >
                          <ExternalLink size={14} />
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Posting Status */}
              {job.postingStatus && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={20} />
                    <h3 className="text-lg font-semibold text-black">Posting Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Groups</span>
                      <span className="font-medium text-black">{job.postingStatus.totalGroups}</span>
                    </div>
                    <div className="space-y-2">
                      {job.postingStatus.posted > 0 && (
                        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor('SUCCESS')}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon('SUCCESS')}
                            <span className="text-sm">Posted</span>
                          </div>
                          <span className="font-medium">{job.postingStatus.posted}</span>
                        </div>
                      )}
                      {job.postingStatus.posting > 0 && (
                        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor('POSTING')}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon('POSTING')}
                            <span className="text-sm">Posting</span>
                          </div>
                          <span className="font-medium">{job.postingStatus.posting}</span>
                        </div>
                      )}
                      {job.postingStatus.pending > 0 && (
                        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor('PENDING')}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon('PENDING')}
                            <span className="text-sm">Pending</span>
                          </div>
                          <span className="font-medium">{job.postingStatus.pending}</span>
                        </div>
                      )}
                      {job.postingStatus.failed > 0 && (
                        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor('FAILED')}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon('FAILED')}
                            <span className="text-sm">Failed</span>
                          </div>
                          <span className="font-medium">{job.postingStatus.failed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics */}
              {analytics && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Analytics</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalComments || 0}</div>
                        <div className="text-sm text-gray-600">Comments</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.interestedCandidates || 0}</div>
                        <div className="text-sm text-gray-600">Interested</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.totalViews || 0}</div>
                        <div className="text-sm text-gray-600">Views</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analytics.totalReactions || 0}</div>
                        <div className="text-sm text-gray-600">Reactions</div>
                      </div>
                    </div>
                    {analytics.eligibleCandidates > 0 && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.eligibleCandidates}</div>
                        <div className="text-sm text-gray-600">Eligible Candidates</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Post Details */}
              {job.posts && job.posts.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Recent Posts</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {job.posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 truncate">
                          {post.facebookGroupUrl}
                        </div>
                        {post.postUrl && (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            <ExternalLink size={12} />
                            View Post
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}