import time
from datetime import datetime

from azure.core.credentials import AccessToken
from kiota_abstractions.api_error import APIError
from msgraph import GraphServiceClient

from msgraph.generated.models.body_type import BodyType
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.message import Message
from msgraph.generated.models.recipient import Recipient
from msgraph.generated.users.item.send_mail.send_mail_post_request_body import SendMailPostRequestBody
from msgraph.generated.users.item.mail_folders.item.messages.messages_request_builder import (
    MessagesRequestBuilder,
)
from kiota_abstractions.base_request_configuration import RequestConfiguration

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
                message=str(e.error.message if getattr(e, "error", None) else e),
            )

    async def send_email(
        self,
        to: list[str],
        subject: str,
        body: str,
        cc: list[str] = None,
        html: bool = True,
    ) -> None:
        message = Message(
            subject=subject,
            body=ItemBody(
                content_type=BodyType.Html if html else BodyType.Text,
                content=body,
            ),
            to_recipients=[
                Recipient(email_address=EmailAddress(address=addr)) for addr in to
            ],
            cc_recipients=[
                Recipient(email_address=EmailAddress(address=addr)) for addr in (cc or [])
            ],
        )
        try:
            await self._graph.me.send_mail.post(SendMailPostRequestBody(message=message))
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if getattr(e, "error", None) else e),
            )

    async def list_emails(
        self,
        folder: str = "inbox",
        top: int = 25,
        filter: str = None,
    ) -> list:
        query_params = MessagesRequestBuilder.MessagesRequestBuilderGetQueryParameters(
            top=top,
            filter=filter,
        )
        config = RequestConfiguration(query_parameters=query_params)
        try:
            result = await self._graph.me.mail_folders.by_mail_folder_id(folder).messages.get(
                request_configuration=config
            )
            return result.value or []
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if getattr(e, "error", None) else e),
            )
