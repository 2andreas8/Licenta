from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv
from base64 import b64encode

load_dotenv()

class MessageEncryptor:
    def __init__(self):
        self.key = os.getenv("MESSAGE_ENCRYPTION_KEY")
        if not self.key:
            self.key = Fernet.generate_key()
        elif isinstance(self.key, str):
            # If the key is a string, convert it to bytes
            self.key = self.key.encode()

        self.fernet = Fernet(self.key)

    def encrypt_message(self, message: str) -> str:
        return self.fernet.encrypt(message.encode()).decode()

    def decrypt_message(self, encrypted_message: str) -> str:
        return self.fernet.decrypt(encrypted_message.encode()).decode()