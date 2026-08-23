import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "kernelcrypt_admin_1337") # Default fallback to not break existing instances without env var