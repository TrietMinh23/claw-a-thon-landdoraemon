import asyncio
from graph import GraphClient

async def main():
    client = GraphClient()

    me = await client.get_me()
    print(f"✅ Logged in as: {me.display_name} ({me.mail})")

    emails = await client.list_emails(top=3)
    print(f"✅ Got {len(emails)} emails from inbox")
    for e in emails:
        print(f"   - {e.subject}")

asyncio.run(main())
