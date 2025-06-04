import { useParams } from "react-router-dom";
import NewChatComponent from "./NewChatComponent";
import ExistingChatComponent from "./ExistingChatComponent";

export default function ChatContainer() {
    const { conversationId } = useParams();

    if (!conversationId || conversationId === "new") {
        return <NewChatComponent />;
    }

    return <ExistingChatComponent conversationId={conversationId} />;
}