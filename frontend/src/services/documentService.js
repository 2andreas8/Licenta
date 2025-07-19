import axios from "axios";

const DOCUMENTS_API_URL = "http://localhost:8000/documents";

export const getDocumentById = async (documentId) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.get(`${DOCUMENTS_API_URL}/${documentId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
}

export const uploadDocument = async (file, onProgressUpdate) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgressUpdate) {
          onProgressUpdate(percentCompleted);
        }
      }
    };

    const response = await axios.post(`${DOCUMENTS_API_URL}/upload`, formData, config);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }

    throw error.response?.data?.detail || error.message || "Unknown error";
  }
};

export const fetchUserDocuments = async() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error("No token found");
    }

    try {
        const res = await axios.get(`${DOCUMENTS_API_URL}/my_files`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }

        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const deleteDocument = async (documentId) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error("No token found");
    }

    try {
        const res = await axios.delete(`${DOCUMENTS_API_URL}/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error) {
        if (error.response?.status ===401) {
            throw new Error("Session expired. Please log in again.");
        }

        console.error("Error deleting document:", error);
        if (error.response?.status === 422) {
            console.warn("Document deleted from database but vectorstore was missing");
            return { message: "Document deleted (vectorstore was already missing)" };
        }

        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const checkDocumentStatus = async (documentId) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error("No token found");
    }

    try {
        const res = await axios.get(`${DOCUMENTS_API_URL}/${documentId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }

        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

