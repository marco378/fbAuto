"use client";
import { useState } from "react";

const FacebookModal = ({ isOpen, onSave }) => {
  const [credentials, setCredentials] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.trim()) {
      onSave(credentials);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-96 border border-gray-200">
        <h2 className="text-xl font-bold mb-6 text-black">Enter Facebook Credentials</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Facebook Username/Email"
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-500"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default FacebookModal;