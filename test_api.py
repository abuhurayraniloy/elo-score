import requests

def test_root():
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Root: {response.status_code}, {response.json()}")
    except Exception as e:
        print(f"Root error: {e}")

def test_login():
    try:
        response = requests.post("http://127.0.0.1:8000/api/auth/login", data={
            "username": "admin",
            "password": "adminpassword"
        })
        print(f"Login: {response.status_code}, {response.json()}")
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_root()
    test_login()
