import { useState } from "react";
import { uploadDocument } from "../../services/documentService";
import { toast } from "react-toastify";

export default function NewChatComponent() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file first!");
            return;
        }
        // TODO: file upload logic here
        setLoading(true);
        try {
            const result = await uploadDocument(file);
            toast.success("File uploaded successfully!");
            // Redirect to chat page or update state as needed
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white rounded shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Start a New Chat</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="file"
                    accept=".pdf,.docx,.txt" // ai si in backend filtrare, vezi
                    onChange={handleFileChange}
                    className="mb-4"
                />
                <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? "Uploading..." : "Upload and Start Chat"}
                </button>
            </form>
        </div>
    )
}