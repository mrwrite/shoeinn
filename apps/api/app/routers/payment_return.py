from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import HTMLResponse


router = APIRouter(prefix="/payment/return", tags=["payment-return"])


def _payment_return_page(*, title: str, body: str) -> HTMLResponse:
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
      .note {{
        color: #4b5563;
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>{title}</h1>
      <p>{body}</p>
      <p class="note">Return to ShoeInn and use the payment status action to continue your booking.</p>
    </main>
  </body>
</html>"""
    )


@router.get("/success")
def payment_success_page() -> HTMLResponse:
    return _payment_return_page(
        title="Payment received",
        body="Your checkout finished successfully.",
    )


@router.get("/cancel")
def payment_cancel_page() -> HTMLResponse:
    return _payment_return_page(
        title="Checkout canceled",
        body="No payment was completed for this booking.",
    )
