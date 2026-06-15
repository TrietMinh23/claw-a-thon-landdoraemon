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


class TestSendEmail:
    async def test_calls_send_mail_post(self, client, mock_graph):
        mock_graph.me.send_mail.post = AsyncMock(return_value=None)
        await client.send_email(
            to=["a@co.com", "b@co.com"],
            subject="Workshop Invite",
            body="<p>Hello</p>",
        )
        mock_graph.me.send_mail.post.assert_called_once()

    async def test_send_email_with_cc(self, client, mock_graph):
        mock_graph.me.send_mail.post = AsyncMock(return_value=None)
        await client.send_email(
            to=["a@co.com"],
            subject="S",
            body="B",
            cc=["c@co.com"],
        )
        call_args = mock_graph.me.send_mail.post.call_args[0][0]
        assert len(call_args.message.cc_recipients) == 1
        assert call_args.message.cc_recipients[0].email_address.address == "c@co.com"

    async def test_wraps_api_error_as_graph_api_error(self, client, mock_graph):
        from graph.exceptions import GraphAPIError
        from kiota_abstractions.api_error import APIError
        api_err = APIError()
        api_err.response_status_code = 403
        mock_graph.me.send_mail.post = AsyncMock(side_effect=api_err)
        with pytest.raises(GraphAPIError) as exc_info:
            await client.send_email(to=["x@co.com"], subject="S", body="B")
        assert exc_info.value.status_code == 403


class TestListEmails:
    async def test_returns_messages_value(self, client, mock_graph):
        fake_msg = MagicMock()
        mock_result = MagicMock()
        mock_result.value = [fake_msg]
        mock_graph.me.mail_folders.by_mail_folder_id.return_value.messages.get = AsyncMock(
            return_value=mock_result
        )
        result = await client.list_emails()
        assert result == [fake_msg]
        mock_graph.me.mail_folders.by_mail_folder_id.assert_called_once_with("inbox")

    async def test_uses_custom_folder_and_top(self, client, mock_graph):
        mock_result = MagicMock()
        mock_result.value = []
        mock_graph.me.mail_folders.by_mail_folder_id.return_value.messages.get = AsyncMock(
            return_value=mock_result
        )
        await client.list_emails(folder="sentitems", top=10)
        mock_graph.me.mail_folders.by_mail_folder_id.assert_called_once_with("sentitems")


from datetime import datetime, timezone


class TestCreateEvent:
    async def test_posts_event_and_returns_result(self, client, mock_graph):
        fake_event = MagicMock()
        mock_graph.me.events.post = AsyncMock(return_value=fake_event)
        start = datetime(2026, 6, 20, 9, 0, tzinfo=timezone.utc)
        end = datetime(2026, 6, 20, 11, 0, tzinfo=timezone.utc)
        result = await client.create_event(
            subject="Workshop Session 1",
            start=start,
            end=end,
            attendees=["a@co.com", "b@co.com"],
        )
        assert result is fake_event
        mock_graph.me.events.post.assert_called_once()

    async def test_includes_location_when_provided(self, client, mock_graph):
        mock_graph.me.events.post = AsyncMock(return_value=MagicMock())
        start = datetime(2026, 6, 20, 9, 0, tzinfo=timezone.utc)
        end = datetime(2026, 6, 20, 11, 0, tzinfo=timezone.utc)
        await client.create_event(
            subject="S", start=start, end=end, attendees=[], location="HN Room"
        )
        posted_event = mock_graph.me.events.post.call_args[0][0]
        assert posted_event.location.display_name == "HN Room"


class TestGetEventResponses:
    async def test_groups_attendees_by_response_status(self, client, mock_graph):
        def make_attendee(email, status_value):
            a = MagicMock()
            a.email_address.address = email
            a.status.response.value = status_value
            return a

        fake_event = MagicMock()
        fake_event.attendees = [
            make_attendee("a@co.com", "accepted"),
            make_attendee("b@co.com", "declined"),
            make_attendee("c@co.com", "tentativelyAccepted"),
            make_attendee("d@co.com", "none"),
        ]
        mock_graph.me.events.by_event_id.return_value.get = AsyncMock(return_value=fake_event)

        result = await client.get_event_responses("event-id-123")
        assert result == {
            "accepted": ["a@co.com"],
            "declined": ["b@co.com"],
            "tentativelyAccepted": ["c@co.com"],
            "none": ["d@co.com"],
        }

    async def test_returns_empty_lists_when_no_attendees(self, client, mock_graph):
        fake_event = MagicMock()
        fake_event.attendees = []
        mock_graph.me.events.by_event_id.return_value.get = AsyncMock(return_value=fake_event)
        result = await client.get_event_responses("event-id-000")
        assert result == {"accepted": [], "declined": [], "tentativelyAccepted": [], "none": []}


class TestReadOneDriveFile:
    async def test_returns_bytes_content(self, client, mock_graph):
        fake_bytes = b"file content here"
        mock_graph.me.drive.items.by_drive_item_id.return_value.content.get = AsyncMock(
            return_value=fake_bytes
        )
        result = await client.read_onedrive_file("item-id-abc")
        assert result == fake_bytes
        mock_graph.me.drive.items.by_drive_item_id.assert_called_once_with("item-id-abc")


class TestReadSharePointFile:
    async def test_returns_bytes_content(self, client, mock_graph):
        fake_bytes = b"sharepoint file"
        mock_graph.sites.by_site_id.return_value.drive.items.by_drive_item_id.return_value.content.get = AsyncMock(
            return_value=fake_bytes
        )
        result = await client.read_sharepoint_file(site_id="site-123", item_id="item-456")
        assert result == fake_bytes
        mock_graph.sites.by_site_id.assert_called_once_with("site-123")
