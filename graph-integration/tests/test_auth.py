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
