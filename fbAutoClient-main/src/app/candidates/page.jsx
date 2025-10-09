"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../../lib/axios";
import { 
  Briefcase, 
  Users, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  RefreshCw,
  Star,
  MessageSquare,
  ExternalLink,
  User
} from "lucide-react";
import { Montserrat } from "next/font/google";

const monte = Montserrat({ subsets: ["latin"] });

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandidates = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await axiosInstance.get("/candidates");
      setCandidates(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to load candidates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    if (score >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${monte.className}`}>
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Candidates</h1>
              <p className="text-gray-600">
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={() => fetchCandidates(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Candidates List */}
          {candidates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600">Candidates will appear here once they apply to your jobs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-1">
                          {candidate.name || 'Anonymous Candidate'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Applied on {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Screening Score Badge */}
                    {candidate.screeningScore != null && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(candidate.screeningScore)}`}>
                        <Star size={14} className="inline mr-1" />
                        {candidate.screeningScore}/100
                      </div>
                    )}
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Contact Info</h4>
                      <div className="space-y-3">
                        {candidate.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Mail size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-gray-600">Email</p>
                              <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                                {candidate.email}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {candidate.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                              <Phone size={14} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-600">Phone</p>
                              <a href={`tel:${candidate.phone}`} className="text-green-600 hover:underline">
                                {candidate.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {candidate.resumeUrl && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                              <FileText size={14} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="text-gray-600">Resume</p>
                              <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline flex items-center gap-1"
                              >
                                View Document <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Professional Info</h4>
                      <div className="space-y-3">
                        {candidate.experience && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                              <Briefcase size={14} className="text-orange-600" />
                            </div>
                            <div>
                              <p className="text-gray-600">Experience</p>
                              <p className="text-black font-medium">{candidate.experience}</p>
                            </div>
                          </div>
                        )}

                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex items-start gap-3 text-sm">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                              <Users size={14} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-600 mb-2">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {candidate.preferredInterviewTime && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                              <Calendar size={14} className="text-teal-600" />
                            </div>
                            <div>
                              <p className="text-gray-600">Interview Preference</p>
                              <p className="text-black font-medium">{candidate.preferredInterviewTime}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Additional Info</h4>
                      <div className="space-y-3">
                        {candidate.screeningScore != null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Screening Score</span>
                              <span className="font-medium">{candidate.screeningScore}/100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getScoreColor(candidate.screeningScore)} transition-all duration-300`}
                                style={{ width: `${candidate.screeningScore}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {candidate.notes && (
                          <div className="text-sm">
                            <p className="text-gray-500 mb-1">Notes</p>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-xs leading-relaxed">
                              {candidate.notes}
                            </p>
                          </div>
                        )}

                        {candidate.conversationSummary && (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare size={12} className="text-gray-500" />
                              <p className="text-gray-500">Conversation Summary</p>
                            </div>
                            <p className="text-gray-800 bg-gray-50 p-3 h-92 rounded-lg text-xs leading-relaxed line-clamp-3">
                              {candidate.conversationSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}