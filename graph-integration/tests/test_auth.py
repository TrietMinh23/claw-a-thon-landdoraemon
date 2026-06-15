import json
import time
from unittest.mock import MagicMock, mock_open, patch

import pytest

import graph.auth as auth_module
from graph.auth import get_access_token
from graph.exceptions import AuthError, TokenCacheError


class TestLoadTokenCache:
    def test_returns_empty_dict_when_no_file(self):
        with patch("graph.auth.os.path.exists", return_value=False):
            from graph.auth import _load_token_cache
            assert _load_token_cache() == {}

    def test_loads_json_from_file(self):
        data = {"access_token": "tok", "expires_at": 9999999999.0}
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data=json.dumps(data))):
            from graph.auth import _load_token_cache
            assert _load_token_cache() == data

    def test_raises_token_cache_error_when_file_corrupt(self):
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", side_effect=OSError("permission denied")):
            from graph.auth import _load_token_cache
            with pytest.raises(TokenCacheError, match="permission denied"):
                _load_token_cache()


class TestSaveTokenCache:
    def test_writes_json(self):
        data = {"access_token": "tok", "expires_at": 9999999999.0}
        with patch("builtins.open", mock_open()) as mock_file, \
             patch("graph.auth.TOKEN_CACHE_PATH", "cache.json"):
            from graph.auth import _save_token_cache
            _save_token_cache(data)
            mock_file.assert_called_once_with("cache.json", "w")

    def test_raises_token_cache_error_on_write_failure(self):
        with patch("builtins.open", side_effect=OSError("disk full")):
            from graph.auth import _save_token_cache
            with pytest.raises(TokenCacheError, match="disk full"):
                _save_token_cache({"access_token": "tok"})


class TestGetAccessToken:
    def test_returns_cached_token_when_not_expired(self):
        cache = {"access_token": "cached-tok", "expires_at": time.time() + 3600}
        with patch.object(auth_module, "_load_token_cache", return_value=cache):
            assert get_access_token() == "cached-tok"

    def test_refreshes_when_token_expired(self):
        cache = {
            "access_token": "old-tok",
            "refresh_token": "ref-tok",
            "expires_at": time.time() - 1,
        }
        refreshed = {"access_token": "new-tok", "refresh_token": "new-ref", "expires_in": 3600}
        with patch.object(auth_module, "_load_token_cache", return_value=cache), \
             patch.object(auth_module, "_refresh_access_token", return_value=refreshed), \
             patch.object(auth_module, "_save_token_cache"):
            assert get_access_token() == "new-tok"

    def test_falls_back_to_device_flow_when_refresh_fails(self):
        cache = {
            "access_token": "old-tok",
            "refresh_token": "bad-ref",
            "expires_at": time.time() - 1,
        }
        device_result = {"access_token": "device-tok", "refresh_token": "new-ref", "expires_in": 3600}
        with patch.object(auth_module, "_load_token_cache", return_value=cache), \
             patch.object(auth_module, "_refresh_access_token", side_effect=AuthError("expired")), \
             patch.object(auth_module, "_device_flow", return_value=device_result), \
             patch.object(auth_module, "_save_token_cache"):
            assert get_access_token() == "device-tok"

    def test_uses_device_flow_when_no_cache(self):
        device_result = {"access_token": "tok", "refresh_token": "ref", "expires_in": 3600}
        with patch.object(auth_module, "_load_token_cache", return_value={}), \
             patch.object(auth_module, "_device_flow", return_value=device_result), \
             patch.object(auth_module, "_save_token_cache"):
            assert get_access_token() == "tok"
