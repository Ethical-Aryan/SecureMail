import unittest
import base64
from crypto_vault import encrypt_body, decrypt_body, verify_passkey, hash_passkey

class TestCryptoVault(unittest.TestCase):
    def setUp(self):
        self.passkey = "1234-ABCD"
        self.message = "This is a top-secret enterprise message body."

    def test_encryption_decryption_success(self):
        # 1. Encrypt the body
        ciphertext, salt = encrypt_body(self.message, self.passkey)
        self.assertNotEqual(ciphertext, self.message)
        self.assertTrue(len(ciphertext) > 0)
        self.assertTrue(len(salt) > 0)

        # 2. Decrypt with correct passkey
        decrypted = decrypt_body(ciphertext, salt, self.passkey)
        self.assertEqual(decrypted, self.message)

    def test_decryption_failure_with_wrong_passkey(self):
        ciphertext, salt = encrypt_body(self.message, self.passkey)
        
        # Try decrypting with wrong key, should raise exception
        with self.assertRaises(Exception):
            decrypt_body(ciphertext, salt, "wrong-passkey")

    def test_verify_passkey_success(self):
        ciphertext, salt = encrypt_body(self.message, self.passkey)
        hashed = hash_passkey(self.passkey, salt)
        stored_field = f"{salt}:{hashed}"

        # Verify correct passkey
        self.assertTrue(verify_passkey(stored_field, self.passkey))

    def test_verify_passkey_failure(self):
        ciphertext, salt = encrypt_body(self.message, self.passkey)
        hashed = hash_passkey(self.passkey, salt)
        stored_field = f"{salt}:{hashed}"

        # Verify incorrect passkey
        self.assertFalse(verify_passkey(stored_field, "wrong-passkey"))
        self.assertFalse(verify_passkey(stored_field, ""))
        self.assertFalse(verify_passkey(None, self.passkey))

if __name__ == "__main__":
    unittest.main()
