import requests
import random
import string


def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_register():
    username = f"user_{random_string()}"
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@example.com",
                "password": "password123",
            },
        )
        print(f"Register: {response.status_code}, {response.json()}")
    except Exception as e:
        print(f"Register error: {e}")


if __name__ == "__main__":
    test_register()
