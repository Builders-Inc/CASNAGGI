import os
import sys

# Set up the virtual environment path if needed for Phusion Passenger.
# Usually, Namecheap's "Setup Python App" sets this up automatically,
# but it's good practice to ensure the current directory is in sys.path.
sys.path.insert(0, os.path.dirname(__file__))

# Import the FastAPI application instance
from server import app

# Import a2wsgi to adapt the ASGI app to WSGI
from a2wsgi import ASGIMiddleware

# Wrap the FastAPI app with the ASGI-to-WSGI middleware.
# Passenger looks for a WSGI application named `application` by default.
application = ASGIMiddleware(app)
