from unittest.mock import MagicMock, mock_open, patch

import msal
import pytest

from graph.exceptions import TokenCacheError


class TestLoadCache:
    def test_returns_empty_cache_when_no_file(self):
        with patch("os.path.exists", return_value=False):
            from graph.auth import _load_cache
            cache = _load_cache()
            assert isinstance(cache, msal.SerializableTokenCache)

    def test_deserializes_cache_from_file(self):
        fake_data = '{"AccessToken": {}}'
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data=fake_data)):
            from graph.auth import _load_cache
            with patch.object(msal.SerializableTokenCache, "deserialize") as mock_deser:
                _load_cache()
                mock_deser.assert_called_once_with(fake_data)

    def test_raises_token_cache_error_when_file_unreadable(self):
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", side_effect=OSError("permission denied")):
            from graph.auth import _load_cache
            with pytest.raises(TokenCacheError, match="permission denied"):
                _load_cache()


class TestSaveCache:
    def test_writes_when_state_changed(self):
        mock_cache = MagicMock()
        mock_cache.has_state_changed = True
        mock_cache.serialize.return_value = '{"AccessToken": {}}'
        with patch("builtins.open", mock_open()) as mock_file, \
             patch("graph.auth.TOKEN_CACHE_PATH", "cache.json"):
            from graph.auth import _save_cache
            _save_cache(mock_cache)
            mock_file.assert_called_once_with("cache.json", "w")

    def test_skips_write_when_state_unchanged(self):
        mock_cache = MagicMock()
        mock_cache.has_state_changed = False
        with patch("builtins.open", mock_open()) as mock_file:
            from graph.auth import _save_cache
            _save_cache(mock_cache)
            mock_file.assert_not_called()


import graph.auth as auth_module
from graph.auth import get_access_token
from graph.exceptions import AuthError


class TestGetAccessToken:
    def _mock_app(self, accounts=None, silent_result=None):
        app = MagicMock()
        app.get_accounts.return_value = accounts or []
        app.acquire_token_silent.return_value = silent_result
        return app

    def test_returns_token_from_silent_when_account_in_cache(self):
        app = self._mock_app(
            accounts=[{"username": "user@co.com"}],
            silent_result={"access_token": "tok-silent"},
        )
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"):
            assert get_access_token() == "tok-silent"
            app.acquire_token_silent.assert_called_once()

    def test_opens_browser_when_no_cached_account(self):
        app = self._mock_app(accounts=[])
        app.acquire_token_by_authorization_code.return_value = {"access_token": "tok-browser"}
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"), \
             patch.object(auth_module, "_get_auth_code_via_browser", return_value="code-xyz"):
            assert get_access_token() == "tok-browser"
            app.acquire_token_by_authorization_code.assert_called_once()

    def test_raises_auth_error_when_msal_returns_error(self):
        app = self._mock_app(
            accounts=[{"username": "user@co.com"}],
            silent_result={"error": "invalid_grant", "error_description": "Token expired"},
        )
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"):
            with pytest.raises(AuthError, match="Token expired"):
                get_access_token()
