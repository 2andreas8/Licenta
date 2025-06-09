import React, { useState } from "react";
import HeaderComponent from "./HeaderComponent";
import SidebarComponent from "./SidebarComponent";
import ProfileComponent from "../profile/ProfileComponent";
import MyDocumentsComponent from '../profile/MyDocumentsComponent';

export default function Layout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [refreshConversations, setRefreshConversations] = useState(0);

    const handleDocumentDeleted = () => {
        setRefreshConversations(prev => prev + 1);
    }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col flex-1">
        <HeaderComponent 
            onShowProfile={() => setShowProfile(true)}
            onSidebarToggle={() => setSidebarOpen(true)}
            isSidebarOpen={isSidebarOpen}
        />
        <SidebarComponent
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            setDocs={setShowDocs}
            refreshTrigger={refreshConversations}
        />
        <main className="flex flex-1 overflow-y-auto bg-gradient-to-b from-purple-700 to-purple-900">
          {children}
        </main>
        {showProfile && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="relative bg-slate-800 text-white rounded-lg p-6 shadow-2xl max-w-md w-full">
                    <button
                        onClick={() => setShowProfile(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl"
                    >
                        &times;
                    </button>
                    <ProfileComponent />
                </div>
            </div>
        )}
        {showDocs && (
          <div className="fixed inset-0 bg-black/50 flex items-center juistify-center z-50">
            <MyDocumentsComponent 
              onClose={() => setShowDocs(false)} 
              onDocumentDeleted={handleDocumentDeleted}
            />
          </div>
        )}
      </div>
    </div>
  );
}