import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from config import ALLOWED_ORIGINS
from routers import auth as auth_router
from routers import dashboard as dashboard_router
from routers import orders as orders_router
from routers import users as users_router
from routers import audit_logs as audit_logs_router
from routers import subscriptions as subscriptions_router
from routers import emails as emails_router
from routers import games_library as games_library_router
from routers import game_requests as game_requests_router
from routers import campaign as campaign_router
from routers import devices as devices_router

app = FastAPI(title="SaudiDeck Hub", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api")
app.include_router(dashboard_router.router, prefix="/api")
app.include_router(orders_router.router, prefix="/api")
app.include_router(users_router.router, prefix="/api")
app.include_router(audit_logs_router.router, prefix="/api")
app.include_router(subscriptions_router.router, prefix="/api")
app.include_router(emails_router.router, prefix="/api")
app.include_router(games_library_router.router, prefix="/api", tags=["games-library"])
app.include_router(game_requests_router.router, prefix="/api", tags=["game-requests"])
app.include_router(campaign_router.router, prefix="/api")
app.include_router(devices_router.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


_POLICY_STYLE = """
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #e0e0e0; background: #0d0d1a; line-height: 1.7; }
  h1 { color: #a78bfa; } h2 { color: #c4b5fd; margin-top: 32px; }
  a { color: #a78bfa; } p, li { color: #b0b0c0; }
"""


@app.get("/privacy", response_class=HTMLResponse)
def privacy_policy():
    return HTMLResponse(f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy – SaudiDeck</title><style>{_POLICY_STYLE}</style></head><body>
<h1>Privacy Policy</h1>
<p><strong>Last updated:</strong> March 2026</p>
<p>SaudiDeck ("we", "our") operates the SaudiDeck platform and messaging services. This policy explains what information we collect and how we use it.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Name and contact details you provide when registering or messaging us</li>
  <li>Messages sent through WhatsApp Business to our service number</li>
  <li>Order and subscription information related to your purchases</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>To respond to your game requests and support inquiries</li>
  <li>To process and fulfill your orders</li>
  <li>To send order updates and notifications via WhatsApp</li>
  <li>To improve our services</li>
</ul>

<h2>Data Sharing</h2>
<p>We do not sell or share your personal information with third parties except as required to fulfill your order (e.g., payment processors) or as required by law.</p>

<h2>WhatsApp Messaging</h2>
<p>By messaging us on WhatsApp, you consent to receiving responses and order-related notifications through that channel. You may opt out at any time by sending "STOP".</p>

<h2>Data Retention</h2>
<p>We retain your data for as long as necessary to provide our services or as required by applicable law.</p>

<h2>Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data by contacting us at <a href="mailto:saudideck3@proton.me">saudideck3@proton.me</a>.</p>

<h2>Contact</h2>
<p>For any privacy-related questions: <a href="mailto:saudideck3@proton.me">saudideck3@proton.me</a></p>
</body></html>""")


@app.get("/terms", response_class=HTMLResponse)
def terms_of_service():
    return HTMLResponse(f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terms of Service – SaudiDeck</title><style>{_POLICY_STYLE}</style></head><body>
<h1>Terms of Service</h1>
<p><strong>Last updated:</strong> March 2026</p>
<p>By using SaudiDeck services, including our WhatsApp messaging channel, you agree to these terms.</p>

<h2>Services</h2>
<p>SaudiDeck provides a game library, game request submissions, and order management services. We use WhatsApp Business to communicate order updates and respond to inquiries.</p>

<h2>User Responsibilities</h2>
<ul>
  <li>Provide accurate information when submitting game requests or orders</li>
  <li>Use our WhatsApp channel only for legitimate service inquiries</li>
  <li>Do not send spam, abusive, or misleading messages</li>
</ul>

<h2>WhatsApp Messaging</h2>
<p>By initiating a conversation with us on WhatsApp, you consent to receive messages related to your requests and orders. Standard WhatsApp messaging rates may apply depending on your carrier.</p>

<h2>Intellectual Property</h2>
<p>All content on SaudiDeck platforms is owned by SaudiDeck. Game titles and trademarks belong to their respective owners.</p>

<h2>Limitation of Liability</h2>
<p>SaudiDeck is not liable for any indirect or consequential damages arising from use of our services.</p>

<h2>Changes to Terms</h2>
<p>We may update these terms at any time. Continued use of our services constitutes acceptance of the updated terms.</p>

<h2>Contact</h2>
<p><a href="mailto:saudideck3@proton.me">saudideck3@proton.me</a></p>
</body></html>""")


# Serve built React frontend (production)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        return FileResponse(f"{STATIC_DIR}/index.html")
