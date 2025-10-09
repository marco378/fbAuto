"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Send } from "lucide-react";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../../components/Sidebar";

import { Montserrat } from "next/font/google";

const monte = Montserrat({ subsets: ["latin"] });

export default function CreateJob() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    jobType: "",
    experience: "",
    salaryRange: "",
    description: "",
    requirements: [""],
    responsibilities: [""],
    perks: "",
    facebookGroups: [""],
    autoPost: false,
  });

  const jobTypes = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "FREELANCE",
    "INTERNSHIP",
  ];

  const experienceLevels = [
    "Entry Level",
    "1-2 years",
    "3-5 years",
    "5-7 years",
    "7-10 years",
    "10+ years",
    "Senior Level",
    "Executive Level",
  ];

  const facebookGroups = [
    {name: "Sample Group", url: "https://www.facebook.com/groups/1050031650534401"},
    { name: "Carpenter Job UK", url: "https://m.facebook.com/groups/carpenterjobuk/" },
    { name: "Carpenters Jobs UK", url: "https://m.facebook.com/Carpentersjobsinuk/" },
    { name: "Const Jobs", url: "https://m.facebook.com/groups/ConstJobs/?locale=en_GB" },
    { name: "Construction Jobs SRG", url: "https://m.facebook.com/construction.jobs.srg/" },
    { name: "Construction Trades", url: "https://m.facebook.com/groups/constructiontrades/" },
    { name: "CPCS Operators New", url: "https://m.facebook.com/groups/CPCSOperatorsNew/" },
    { name: "Dump Truck Operators", url: "https://m.facebook.com/groups/dumptruckops/" },
    { name: "Construction Group", url: "https://m.facebook.com/groups/130867920827335/" },
    { name: "Building & Construction Jobs", url: "https://m.facebook.com/groups/1346620668788275/" },
    { name: "UK Construction Jobs", url: "https://m.facebook.com/groups/137089230204021/" },
    { name: "Construction Work UK", url: "https://m.facebook.com/groups/1509427582617246/?locale=en_GB" },
    { name: "Building Trade Jobs", url: "https://m.facebook.com/groups/1511495399266957/?locale=en_GB" },
    { name: "Construction Employment", url: "https://m.facebook.com/groups/1539581272738751/?locale=en_GB" },
    { name: "Trade Jobs Network", url: "https://m.facebook.com/groups/1604035263187804/" },
    { name: "Construction Opportunities", url: "https://m.facebook.com/groups/1609356909305286/" },
    { name: "Building Industry Jobs", url: "https://m.facebook.com/groups/1819775234976070/?locale=en_GB&wtsid=rdr_0Pkpa1PD9dEvQnhMg" },
    { name: "Construction Careers", url: "https://m.facebook.com/groups/1805456463079839/" },
    { name: "Trade Professionals", url: "https://m.facebook.com/groups/187439525318892/" },
    { name: "Construction Workforce", url: "https://m.facebook.com/groups/2003424126588653/" },
    { name: "Building Trade Network", url: "https://m.facebook.com/groups/2147370392227234/?locale=en_GB" },
    { name: "Construction Jobs Board", url: "https://m.facebook.com/groups/221760221601820/" },
    { name: "Trade Employment Hub", url: "https://m.facebook.com/groups/2292548827588355/" },
    { name: "Building Workers Unite", url: "https://m.facebook.com/groups/235252270579078/" },
    { name: "Construction Job Search", url: "https://m.facebook.com/groups/2367854993441185/" },
    { name: "Trade Jobs Central", url: "https://m.facebook.com/groups/2389065407971693/" },
    { name: "Building Industry Network", url: "https://m.facebook.com/groups/2646049568994772/" },
    { name: "Construction Workers Hub", url: "https://m.facebook.com/groups/312331869133328/?locale=en_GB" },
    { name: "Trade Jobs Directory", url: "https://m.facebook.com/groups/338164250506857/?locale=en_GB" },
    { name: "Construction Employment Hub", url: "https://m.facebook.com/groups/390322387803488/" },
    { name: "Building Trade Careers", url: "https://m.facebook.com/groups/397659453953374/" },
    { name: "Construction Job Portal", url: "https://m.facebook.com/groups/404053401577312/?locale=en_GB" },
    { name: "Trade Work Opportunities", url: "https://m.facebook.com/groups/481597765549105/?locale=en_GB" },
    { name: "Construction Industry Jobs", url: "https://m.facebook.com/groups/481664786580230/?locale=en_GB" },
    { name: "Building Jobs Network", url: "https://m.facebook.com/groups/517093619298982/" },
    { name: "Trade Employment Network", url: "https://m.facebook.com/groups/537613993341852/" },
    { name: "Construction Career Hub", url: "https://m.facebook.com/groups/622321471278801/?locale=en_GB" },
    { name: "Building Trade Jobs Board", url: "https://m.facebook.com/groups/673211636094447/" },
    { name: "Construction Work Network", url: "https://m.facebook.com/groups/685913491517824/?locale=en_GB" },
    { name: "Trade Jobs Community", url: "https://m.facebook.com/groups/765587586881094/?locale=en_GB" },
    { name: "Building Industry Careers", url: "https://m.facebook.com/groups/799061177190899/" },
    { name: "Construction Job Network", url: "https://m.facebook.com/groups/861635444833206/" },
    { name: "Trade Work Hub", url: "https://m.facebook.com/groups/988828581527295/" },
    { name: "HS2 Jobs", url: "https://m.facebook.com/groups/HS2Jobs/" },
    { name: "Job Construction", url: "https://m.facebook.com/groups/jobconstruction/" },
    { name: "PTS Rail Jobs", url: "https://m.facebook.com/groups/ptsrailjobs/?locale=en_GB" },
    { name: "Traffic Marshal", url: "https://m.facebook.com/trafficmarshal/" },
    { name: "Traffic Marshal Training", url: "https://m.facebook.com/infotrafficmarshaltraining.org/" },
    { name: "Utility Lads Jobs", url: "https://m.facebook.com/groups/UtilityLadsJobs/?locale=en_GB" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (index, field) => {
    if (formData[field].length > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty strings from arrays
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter((req) => req.trim()),
        responsibilities: formData.responsibilities.filter((resp) =>
          resp.trim()
        ),
        facebookGroups: formData.facebookGroups.filter((group) => group.trim()),
      };

      const response = await axiosInstance.post("/jobs", cleanedData);

      if (response.data) {
        router.push("/job-posts");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen bg-white ${monte.className}`}>
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-black">Create New Job</h1>
              <p className="text-gray-600">
                Fill in the details to post a new job
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)] p-8 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                    placeholder="e.g. Tech Solutions Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                    placeholder="e.g. New York, NY or Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Job Type *
                  </label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                  >
                    <option value="">Select job type</option>
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                    placeholder="e.g. $70,000 - $90,000"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                  placeholder="Describe the job role, what you're looking for, and any important details..."
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Requirements
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) =>
                          handleArrayInputChange(
                            index,
                            e.target.value,
                            "requirements"
                          )
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                        placeholder="e.g. Bachelor's degree in Computer Science"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem(index, "requirements")}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem("requirements")}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <Plus size={16} />
                    Add Requirement
                  </button>
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Responsibilities
                </label>
                <div className="space-y-2">
                  {formData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) =>
                          handleArrayInputChange(
                            index,
                            e.target.value,
                            "responsibilities"
                          )
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                        placeholder="e.g. Develop and maintain web applications"
                      />
                      {formData.responsibilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem(index, "responsibilities")
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem("responsibilities")}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <Plus size={16} />
                    Add Responsibility
                  </button>
                </div>
              </div>

              {/* Perks */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Perks & Benefits
                </label>
                <textarea
                  name="perks"
                  value={formData.perks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent"
                  placeholder="e.g. Health insurance, flexible hours, remote work options..."
                />
              </div>

              {/* Facebook Groups */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Facebook Group
                </label>
                <div className="relative">
                  <select
                    name="facebookGroups"
                    value={formData.facebookGroups[0] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        facebookGroups: e.target.value ? [e.target.value] : [],
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[0.5px] focus:ring-neutral-400 focus:border-transparent appearance-none"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="">Choose a group to post</option>
                    {facebookGroups.map((group, index) => (
                      <option key={index} value={group.url}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Post */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoPost"
                  name="autoPost"
                  checked={formData.autoPost}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-[0.5px]"
                />
                <label
                  htmlFor="autoPost"
                  className="text-sm font-medium text-black"
                >
                  Auto-post to Facebook groups after creating the job
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Create Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}