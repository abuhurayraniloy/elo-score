import requests

res = requests.post("http://127.0.0.1:8000/api/auth/login", data={"username": "testuser", "password": "testpassword"})
if res.status_code == 200:
    token = res.json()["access_token"]
    res = requests.get("http://127.0.0.1:8000/api/next-match", headers={"Authorization": f"Bearer {token}"})
    print(res.status_code)
    print(res.json())
else:
    print("Login failed", res.text)
