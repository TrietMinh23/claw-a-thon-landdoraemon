import time
from datetime import datetime

from azure.core.credentials import AccessToken
from kiota_abstractions.api_error import APIError
from msgraph import GraphServiceClient

from msgraph.generated.models.attendee import Attendee
from msgraph.generated.models.attendee_type import AttendeeType
from msgraph.generated.models.body_type import BodyType
from msgraph.generated.models.date_time_time_zone import DateTimeTimeZone
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.models.event import Event
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.location import Location
from msgraph.generated.models.message import Message
from msgraph.generated.models.recipient import Recipient
from msgraph.generated.users.item.send_mail.send_mail_post_request_body import SendMailPostRequestBody

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
    ) -> list:
        try:
            result = await self._graph.me.mail_folders.by_mail_folder_id(folder).messages.get()
            return (result.value or [])[:top]
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(getattr(e, "error", None) or e),
            )

    async def create_event(
        self,
        subject: str,
        start: datetime,
        end: datetime,
        attendees: list[str],
        body: str = None,
        location: str = None,
    ):
        if start.tzinfo is None or end.tzinfo is None:
            raise ValueError("start and end datetimes must be timezone-aware")
        event = Event(
            subject=subject,
            start=DateTimeTimeZone(date_time=start.isoformat(), time_zone="UTC"),
            end=DateTimeTimeZone(date_time=end.isoformat(), time_zone="UTC"),
            attendees=[
                Attendee(
                    email_address=EmailAddress(address=addr),
                    type=AttendeeType.Required,
                )
                for addr in attendees
            ],
            body=ItemBody(content_type=BodyType.Html, content=body) if body else None,
            location=Location(display_name=location) if location else None,
        )
        try:
            return await self._graph.me.events.post(event)
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(getattr(e, "error", None) or e),
            )

    async def read_onedrive_file(self, item_id: str) -> bytes:
        try:
            return await self._graph.me.drive.items.by_drive_item_id(item_id).content.get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(getattr(e, "error", None) or e),
            )

    async def read_sharepoint_file(self, site_id: str, item_id: str) -> bytes:
        try:
            return await (
                self._graph.sites.by_site_id(site_id)
                .drive.items.by_drive_item_id(item_id)
                .content.get()
            )
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(getattr(e, "error", None) or e),
            )

    async def get_event_responses(self, event_id: str) -> dict:
        try:
            event = await self._graph.me.events.by_event_id(event_id).get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(getattr(e, "error", None) or e),
            )
        result: dict[str, list] = {
            "accepted": [],
            "declined": [],
            "tentativelyAccepted": [],
            "none": [],
        }
        for attendee in event.attendees or []:
            status = (attendee.status.response.value if attendee.status and attendee.status.response else "none")
            email = attendee.email_address.address if attendee.email_address else ""
            bucket = status if status in result else "none"
            result[bucket].append(email)
        return result
