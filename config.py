import os
from dotenv import load_dotenv

load_dotenv()

class access:
	Google_Gemini = os.getenv("Google_api_key")

Access = access()