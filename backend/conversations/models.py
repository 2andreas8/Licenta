from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func 
from database.db import Base
from sqlalchemy.orm import relationship
from conversations.utils import MessageEncryptor

class Conversation(Base):
    __tablename__="conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="conversations")
    document = relationship("Document", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__="messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(String) # user / assistant
    encrypted_content = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")

    _encryptor = MessageEncryptor()

    @property
    def content(self) -> str:
        """Decrypt the content when accessed."""
        return self._encryptor.decrypt_message(self.encrypted_content)
    
    @content.setter
    def content(self, value: str):
        """Encrypt the content when set."""
        self.encrypted_content = self._encryptor.encrypt_message(value)