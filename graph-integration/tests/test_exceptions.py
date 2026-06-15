import pytest
from graph.exceptions import AuthError, GraphAPIError, TokenCacheError


def test_auth_error_is_exception():
    err = AuthError("token revoked")
    assert str(err) == "token revoked"
    assert isinstance(err, Exception)


def test_graph_api_error_stores_status_and_message():
    err = GraphAPIError(status_code=403, message="Forbidden")
    assert err.status_code == 403
    assert err.message == "Forbidden"
    assert "403" in str(err)
    assert "Forbidden" in str(err)


def test_token_cache_error_is_exception():
    err = TokenCacheError("cache corrupt")
    assert str(err) == "cache corrupt"
    assert isinstance(err, Exception)
