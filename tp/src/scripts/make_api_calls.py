import requests
import json
import cookielib

url = 'https://online-demo.toppatch.com'
api_version = '/api/v1'
api_call = '/agents'
login_uri = '/login'

creds = {'username': 'admin', 'password': 'toppatch'}
session = requests.session()
headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
jar = cookielib.CookieJar()

authenticated = session.post(url + login_uri, data=json.dumps(creds), verify=False, headers=headers, cookies=jar)
if authenticated.ok:
    print 'authenticated'
    data = session.get(url + api_version + api_call, verify=False, headers=headers, cookies=jar)
    if data.ok:
        print json.loads(data.content)
