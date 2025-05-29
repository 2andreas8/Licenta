import { useState, useEffect } from "react";
import { fetchUserDocuments } from "../../services/documentService";

export default function MyDocumentsComponent({ onClose }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDocuments()
            .then(setDocs)
            .catch(err => {
                console.error("Error loading documents: ", err);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relative p-8 bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto border-b border-gray-600 text-white">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold transition"
                aria-label="Close"
            >
                &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-400">📄</span> My Documents
            </h2>
            <hr className="border-slate-600 mb-6" />
            {loading ? (
                <div className="text-center text-purple-300 py-8">Loading...</div>
            ) : docs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No documents uploaded yet.</div>
            ) : (
                <ul className="space-y-3">
                    {docs.map(doc => (
                        <li
                            key={doc.id}
                            className="flex items-center justify-between px-2 py-2 rounded hover:bg-slate-700 transition"
                        >
                            <span className="truncate">{doc.filename}</span>
                            {/* Poți adăuga aici acțiuni (ex: download, delete) */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}