import requests
import json

url = "http://localhost:5000/predict"

test_cases = [
    {"user_id": "A", "receiver": "Amazon", "amount": 1200},  # Low risk (Normal for A)
    {"user_id": "A", "receiver": "Unknown", "amount": 5000}, # High risk (High for A)
    {"user_id": "B", "receiver": "Amazon", "amount": 14000}, # Low risk (Normal for B)
    {"user_id": "B", "receiver": "Local Shop", "amount": 1000}, # High risk (Too low for B)
]

def test_api():
    print("--- Testing SecurePay API ---")
    for case in test_cases:
        print(f"\nRequest: {case}")
        try:
            response = requests.post(url, json=case)
            if response.status_code == 200:
                print(f"Response: {json.dumps(response.json(), indent=2)}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Connection error: {e}")

if __name__ == "__main__":
    test_api()
