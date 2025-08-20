import sys
from pathlib import Path

# Ensure the API app is importable as 'app'
api_path = Path(__file__).resolve().parent
if str(api_path) not in sys.path:
    sys.path.insert(0, str(api_path))
