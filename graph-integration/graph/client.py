import time
from datetime import datetime

from azure.core.credentials import AccessToken
from kiota_abstractions.api_error import APIError
from msgraph import GraphServiceClient

from graph.auth import SCOPES, get_access_token
from graph.exceptions import GraphAPIError


class _MSALCredential:
    def get_token(self, *scopes, **kwargs):
        token = get_access_token()
        return AccessToken(token, int(time.time()) + 3600)


class GraphClient:
    def __init__(self):
        self._graph = GraphServiceClient(
            credentials=_MSALCredential(),
            scopes=SCOPES,
        )

    async def get_me(self):
        try:
            return await self._graph.me.get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )
