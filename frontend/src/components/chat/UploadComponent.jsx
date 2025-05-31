import React from "react";

export default function UploadComponent({ onClose, onFileUpload, onFileSelect, loading, existingFiles, selectedFileId, setSelectedFileId, handleFileChange, handleSubmit }) {
    
    return (
    <div className="flex items-center justify-center bg-black/50 z-40">
      <div className="relative bg-white rounded-lg shadow-2xl p-10 w-full max-w-md flex flex-col items-center">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Start a new chat</h2>
        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center mb-6">
          <label className="font-semibold text-gray-700 mb-2 w-full text-left">Upload a new file</label>
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="mb-4 w-full" />
          <button type="submit" className="bg-purple-600 text-white px-6 py-3 w-full rounded hover:bg-purple-700 transition-colors" disabled={loading}>
            {loading ? "Uploading..." : "Upload and Start Chat"}
          </button>
        </form>
        {/* Separator */}
        <div className="flex items-center w-full my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-400 font-semibold">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        {/* Existing Files Section */}
        {existingFiles.length > 0 && ( 
          <div className="w-full flex flex-col items-center">
            <label className="font-semibold text-gray-700 mb-2 w-full text-left">Select an existing file</label>
            <div className="flex w-full gap-2">
              <select className="border rounded px-3 py-2 flex-1" value={selectedFileId || ""} onChange={e => setSelectedFileId(e.target.value)}>
                <option value="">-- Select file --</option>
                {existingFiles.map(file => (
                  <option key={file.id} value={file.id}>{file.filename}</option>
                ))}
              </select>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors" disabled={!selectedFileId} onClick={onFileSelect}>
                Start Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}