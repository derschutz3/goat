from firebase_functions import https_fn
from flask import Flask
from app import create_app

# Initialize Flask app
app = create_app()

# Expose Flask app as a Cloud Function
@https_fn.on_request(
    max_instances=10,
    region="us-central1"
)
def chamados(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
