import { useParams } from "react-router-dom";
import NewChatComponent from "./NewChatComponent";
import ExistingChatComponent from "./ExistingChatComponent";

export default function ChatContainer() {
    const { conversationId } = useParams();

    return (
        <div className="flex-1 flex items-center justify-center py-4 w-full h-full overflow-hidden">
            {!conversationId || conversationId === "new" ? (
                <NewChatComponent />
            ) : (
                <ExistingChatComponent conversationId={conversationId} />
            )}
        </div>
    );
}