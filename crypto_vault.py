import hmac

def verify_passkey(stored_passkey: str, input_passkey: str) -> bool:
    """
    Constant-time string comparison to prevent timing attacks.
    """
    if stored_passkey is None or input_passkey is None:
        return False
    return hmac.compare_digest(stored_passkey.encode('utf-8'), input_passkey.encode('utf-8'))
