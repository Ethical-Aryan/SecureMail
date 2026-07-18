import os
import hmac
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(passkey: str, salt: bytes) -> bytes:
    """Derives a 256-bit AES key from the passkey using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=10000,  # Keeping iterations lightweight for fast local performance
    )
    return kdf.derive(passkey.encode('utf-8'))

def encrypt_body(body: str, passkey: str) -> tuple[str, str]:
    """
    Encrypts a body string using AES-256-GCM.
    Returns (ciphertext_b64, salt_b64).
    """
    salt = os.urandom(16)
    key = derive_key(passkey, salt)
    iv = os.urandom(12)  # Recommended 12 bytes IV for GCM
    
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(body.encode('utf-8')) + encryptor.finalize()
    
    # GCM requires storing the authentication tag
    tag = encryptor.tag
    
    # Pack IV, tag, and ciphertext together
    packed = iv + tag + ciphertext
    return base64.b64encode(packed).decode('utf-8'), base64.b64encode(salt).decode('utf-8')

def decrypt_body(ciphertext_b64: str, salt_b64: str, passkey: str) -> str:
    """
    Decrypts a body string using AES-256-GCM.
    Returns the plain-text body, or raises an error if decryption fails.
    """
    salt = base64.b64decode(salt_b64.encode('utf-8'))
    packed = base64.b64decode(ciphertext_b64.encode('utf-8'))
    
    iv = packed[:12]
    tag = packed[12:28]
    ciphertext = packed[28:]
    
    key = derive_key(passkey, salt)
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    
    decrypted_bytes = decryptor.update(ciphertext) + decryptor.finalize()
    return decrypted_bytes.decode('utf-8')

def verify_passkey(stored_field: str, input_passkey: str) -> bool:
    """
    Verifies the input passkey against the stored 'salt:hash' digest in constant-time.
    """
    if not stored_field or not input_passkey:
        return False
    try:
        salt_b64, expected_hash = stored_field.split(':')
        salt = base64.b64decode(salt_b64.encode('utf-8'))
        
        # Calculate digest
        actual_hash = hashlib.sha256(salt + input_passkey.encode('utf-8')).hexdigest()
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def hash_passkey(passkey: str, salt_b64: str) -> str:
    """
    Hashes a passkey with a given salt for storage verification.
    """
    salt = base64.b64decode(salt_b64.encode('utf-8'))
    return hashlib.sha256(salt + passkey.encode('utf-8')).hexdigest()
