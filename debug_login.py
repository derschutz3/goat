import requests

s = requests.Session()
url = 'http://127.0.0.1:5000'

# 1. Get Login Page
print("Accessing login page...")
r = s.get(f'{url}/login')
print(f"Status: {r.status_code}")

# 2. Post Login
print("Attempting login...")
payload = {'username': 'admin', 'password': 'admin'}
r = s.post(f'{url}/login', data=payload, allow_redirects=True)
print(f"Status: {r.status_code}")
print(f"URL: {r.url}")

if r.status_code == 500:
    print("Error 500 detected!")
    print(r.text)
elif "Listar Chamados" in r.text or "Chamados" in r.text:
    print("Login successful!")
else:
    print("Login failed or unexpected page.")
    # print(r.text[:500])
