class AuthError(Exception):
    pass


class GraphAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Graph API error {status_code}: {message}")


class TokenCacheError(Exception):
    pass
