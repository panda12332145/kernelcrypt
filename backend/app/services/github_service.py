import requests

from app.core.config import (
    GITHUB_USERNAME,
    GITHUB_TOKEN
)

headers = {
    "Authorization": f"Bearer {GITHUB_TOKEN}"
}


def get_github_stats():

    user_url = f"https://api.github.com/users/{GITHUB_USERNAME}"
    repos_url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page=100"

    user_response = requests.get(user_url, headers=headers)
    repos_response = requests.get(repos_url, headers=headers)

    user = user_response.json()
    repos = repos_response.json()

    total_stars = 0
    total_forks = 0

    for repo in repos:

        total_stars += repo.get(
            "stargazers_count",
            0
        )

        total_forks += repo.get(
            "forks_count",
            0
        )

    return {
        "repositories": user.get(
            "public_repos",
            0
        ),

        "stars": total_stars,

        "followers": user.get(
            "followers",
            0
        ),

        "forks": total_forks,

        "contributions": 7200,

        "downloads": "900K+",

        "avatar": user.get(
            "avatar_url",
            ""
        ),

        "bio": user.get(
            "bio",
            ""
        ),

        "profile": user.get(
            "html_url",
            ""
        )
    }