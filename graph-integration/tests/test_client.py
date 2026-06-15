from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import graph.client as client_module
from graph.client import GraphClient


@pytest.fixture
def mock_graph():
    g = MagicMock()
    return g


@pytest.fixture
def client(mock_graph):
    with patch("graph.client.get_access_token", return_value="tok"), \
         patch("graph.client.GraphServiceClient", return_value=mock_graph):
        c = GraphClient()
        c._graph = mock_graph
        return c


class TestGetMe:
    async def test_calls_graph_me_get(self, client, mock_graph):
        mock_graph.me.get = AsyncMock(return_value=MagicMock(display_name="Test User"))
        result = await client.get_me()
        mock_graph.me.get.assert_called_once()
        assert result.display_name == "Test User"
