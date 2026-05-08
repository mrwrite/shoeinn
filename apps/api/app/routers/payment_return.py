from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse

from app.core.config import settings


router = APIRouter(prefix="/payment/return", tags=["payment-return"])


def _build_app_return_url(
    *,
    booking_id: str | None,
    session_id: str | None,
    status: str,
) -> str | None:
    base_url = settings.payment_mobile_redirect_base.strip()
    if not base_url:
        return None

    parsed = urlparse(base_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if booking_id:
        query["booking_id"] = booking_id
    if session_id:
        query["session_id"] = session_id
    base_path = parsed.path.rstrip("/")
    final_path = f"{base_path}/payment/{status}"
    return urlunparse(parsed._replace(path=final_path, query=urlencode(query)))


def _payment_return_page(*, title: str, body: str, app_url: str | None) -> HTMLResponse:
    open_app_link = (
        f'<p><a class="button" href="{app_url}">Open ShoeInn</a></p>'
        if app_url
        else ""
    )
    auto_open_script = (
        f"""
      <script>
        window.setTimeout(function () {{
          window.location.href = {app_url!r};
        }}, 150);
      </script>
"""
        if app_url
        else ""
    )
    app_note = (
        "We also tried to reopen ShoeInn automatically. If the app did not open, use the button below."
        if app_url
        else "Return to ShoeInn manually and use the payment status action to continue your booking."
    )
    return HTMLResponse(
        f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <style>
      body {{
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f3f4f6;
        color: #111827;
      }}
      main {{
        max-width: 520px;
        margin: 48px auto;
        background: #ffffff;
        border-radius: 16px;
        padding: 32px 24px;
        box-shadow: 0 20px 40px rgba(17, 24, 39, 0.08);
      }}
      h1 {{
        margin: 0 0 12px;
        font-size: 28px;
      }}
      p {{
        line-height: 1.5;
        margin: 0 0 12px;
      }}
      .button {{
        display: inline-block;
        margin: 12px 0;
        padding: 12px 16px;
        border-radius: 999px;
        background: #111827;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
      }}
      .note {{
        color: #4b5563;
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>{title}</h1>
      <p>{body}</p>
      {open_app_link}
      <p class="note">{app_note}</p>
    </main>
    {auto_open_script}
  </body>
</html>"""
    )


@router.get("/success")
def payment_success_page(
    booking_id: str | None = Query(default=None),
    session_id: str | None = Query(default=None),
) -> HTMLResponse:
    return _payment_return_page(
        title="Payment received",
        body="Your checkout finished successfully.",
        app_url=_build_app_return_url(
            booking_id=booking_id,
            session_id=session_id,
            status="success",
        ),
    )


@router.get("/cancel")
def payment_cancel_page(
    booking_id: str | None = Query(default=None),
    session_id: str | None = Query(default=None),
) -> HTMLResponse:
    return _payment_return_page(
        title="Checkout canceled",
        body="No payment was completed for this booking.",
        app_url=_build_app_return_url(
            booking_id=booking_id,
            session_id=session_id,
            status="cancel",
        ),
    )
