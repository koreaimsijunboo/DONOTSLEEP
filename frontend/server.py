
import http.server
import ssl
import os
import base64
import json
import shutil
<<<<<<< HEAD
=======
import socket
import threading
import time
import uuid
from http.cookies import SimpleCookie
from urllib.parse import urlparse, parse_qs
>>>>>>> 012e5fb (first commit)

port = 8443
cert_file = './aserver.local+3.pem'
key_file = './aserver.local+3-key.pem'
<<<<<<< HEAD
=======
host = "0.0.0.0"
idle_timeout_sec = int(os.getenv("IDLE_TIMEOUT_SEC", "300"))
last_activity_ts = time.time()
activity_lock = threading.Lock()
terms_queue = []
terms_queue_lock = threading.Lock()
terms_presence_ttl_sec = 20
>>>>>>> 012e5fb (first commit)

os.chdir(os.path.dirname(os.path.abspath(__file__)))


def touch_activity():
    global last_activity_ts
    with activity_lock:
        last_activity_ts = time.time()


def cleanup_terms_queue(now=None):
    current_time = now or time.time()
    with terms_queue_lock:
        terms_queue[:] = [
            item for item in terms_queue
            if current_time - item["last_seen"] <= terms_presence_ttl_sec
        ]


def touch_terms_client(client_id):
    if not client_id:
        client_id = str(uuid.uuid4())

    current_time = time.time()
    cleanup_terms_queue(current_time)

    with terms_queue_lock:
        for item in terms_queue:
            if item["id"] == client_id:
                item["last_seen"] = current_time
                break
        else:
            terms_queue.append({
                "id": client_id,
                "joined_at": current_time,
                "last_seen": current_time,
            })

        queue_ids = [item["id"] for item in terms_queue]
        position = queue_ids.index(client_id)
        is_reader = position == 0
        wait_ahead = 0 if is_reader else position

    return {
        "clientId": client_id,
        "isReader": is_reader,
        "waitCount": wait_ahead,
        "queuePosition": position,
        "queueLength": len(queue_ids),
    }


def remove_terms_client(client_id):
    if not client_id:
        return

    with terms_queue_lock:
        terms_queue[:] = [item for item in terms_queue if item["id"] != client_id]


def get_terms_status(client_id):
    status = touch_terms_client(client_id)
    status["queueMessage"] = (
        "약관을 읽을 수 있습니다."
        if status["isReader"]
        else f"대기: {status['waitCount']}번째"
    )
    return status


def get_cookie_value(handler, name):
    cookie_header = handler.headers.get("Cookie", "")
    if not cookie_header:
        return None

    cookie = SimpleCookie()
    cookie.load(cookie_header)
    morsel = cookie.get(name)
    return morsel.value if morsel else None


def has_terms_access(handler):
    return get_cookie_value(handler, "tos_accepted") == "true"


def send_json(handler, status_code, payload, extra_headers=None):
    handler.send_response(status_code)
    handler.send_header('Content-type', 'application/json')
    if extra_headers:
        for key, value in extra_headers.items():
            handler.send_header(key, value)
    handler.end_headers()
    handler.wfile.write(json.dumps(payload).encode())


def redirect(handler, location):
    handler.send_response(302)
    handler.send_header("Location", location)
    handler.end_headers()


def require_terms_access(handler, path):
    protected_pages = {"/index.html"}
    protected_api_prefixes = {
        "/get-images",
        "/get-settings",
        "/save-image",
        "/save-settings",
        "/delete-image",
        "/delete-all",
    }

    needs_access = path in protected_pages or path in protected_api_prefixes
    if not needs_access:
        return False

    if has_terms_access(handler):
        return False

    if path.startswith("/get-") or path.startswith("/save-") or path.startswith("/delete-"):
        send_json(handler, 403, {"error": "terms agreement required"})
    else:
        redirect(handler, "/terms.html")
    return True


class MyHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        touch_activity()
        parsed = urlparse(self.path)
        path = parsed.path

        if require_terms_access(self, path):
            return

<<<<<<< HEAD
        # ================= 이미지 저장 =================
        if self.path == '/save-image':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))
=======
        # 이미지 저장
        if path == '/save-image':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
>>>>>>> 012e5fb (first commit)

            img_data = data['image'].split(',')[1]
            filename = data['filename']

            os.makedirs('captures', exist_ok=True)

            with open(f"captures/{filename}", "wb") as f:
                f.write(base64.b64decode(img_data))

            self.send_response(200)
            self.end_headers()

<<<<<<< HEAD
        # ================= 설정 저장 =================
        elif self.path == '/save-settings':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))
=======
        # 설정 저장
        elif path == '/save-settings':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
>>>>>>> 012e5fb (first commit)

            with open("settings.json", "w") as f:
                json.dump(data, f)

            self.send_response(200)
            self.end_headers()

<<<<<<< HEAD
        # ================= 이미지 삭제 =================
        elif self.path == '/delete-image':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))
=======
        # 이미지 삭제
        elif path == '/delete-image':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
>>>>>>> 012e5fb (first commit)

            fpath = f"captures/{data['filename']}"

            if os.path.exists(fpath):
                os.remove(fpath)

            self.send_response(200)
            self.end_headers()

<<<<<<< HEAD
        # ================= 전체 삭제 =================
        elif self.path == '/delete-all':
=======
        # 전체 삭제
        elif path == '/delete-all':
>>>>>>> 012e5fb (first commit)
            if os.path.exists('captures'):
                shutil.rmtree('captures')

            os.makedirs('captures')

            self.send_response(200)
            self.end_headers()

<<<<<<< HEAD
=======
        elif path == '/terms-agree':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
            client_id = data.get('clientId')
            status = get_terms_status(client_id)

            if not status["isReader"]:
                send_json(self, 409, {
                    "error": "아직 읽을 차례가 아닙니다.",
                    "status": status,
                })
                return

            remove_terms_client(status["clientId"])
            send_json(self, 200, {"ok": True}, {
                "Set-Cookie": "tos_accepted=true; Path=/; SameSite=Lax",
            })

        elif path == '/terms-leave':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
            remove_terms_client(data.get('clientId'))
            self.send_response(200)
            self.end_headers()

        else:
            self.send_response(404)
            self.end_headers()

    # ================= GET =================
>>>>>>> 012e5fb (first commit)
    def do_GET(self):
        touch_activity()
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

<<<<<<< HEAD
        # ================= 이미지 목록 =================
        if self.path == '/get-images':
=======
        # 🔥 중요: 기본 페이지 연결
        if path == '/':
            self.path = '/terms.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

        if require_terms_access(self, path):
            return

        # 이미지 목록
        elif path == '/get-images':
>>>>>>> 012e5fb (first commit)
            os.makedirs('captures', exist_ok=True)

            files = os.listdir('captures')
            images = []

            for f in sorted(files, reverse=True):
                fpath = f"captures/{f}"

                if os.path.isfile(fpath):
                    with open(fpath, 'rb') as img_file:
                        img_data = base64.b64encode(img_file.read()).decode()

                        images.append({
                            "filename": f,
                            "img": f"data:image/png;base64,{img_data}",
                            "time": os.path.getmtime(fpath)
                        })

            send_json(self, 200, images)

<<<<<<< HEAD
        # ================= 설정 불러오기 =================
        elif self.path == '/get-settings':
=======
        # 설정 불러오기
        elif path == '/get-settings':
>>>>>>> 012e5fb (first commit)

            if os.path.exists("settings.json"):
                with open("settings.json", "r") as f:
                    data = json.load(f)
            else:
                data = {}

            send_json(self, 200, data)

        elif path == '/terms-status':
            client_id = query.get("clientId", [""])[0]
            status = get_terms_status(client_id)
            send_json(self, 200, status)


httpd = http.server.HTTPServer(('', port), MyHandler)


def idle_shutdown_monitor(server):
    while True:
        time.sleep(2)
        with activity_lock:
            idle_for = time.time() - last_activity_ts

        if idle_timeout_sec > 0 and idle_for >= idle_timeout_sec:
            print(f"⏸️  Idle timeout reached ({idle_timeout_sec}s). Server stopped.")
            server.shutdown()
            return

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

try:
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
except FileNotFoundError:
    print("❌ 인증서 없음")
    exit(1)

httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

<<<<<<< HEAD
print(f"🚀 https://aserver.local:{port}")
httpd.serve_forever()
=======
local_ip = get_local_ip()
print(f"🚀 Local: https://localhost:{port}")
print(f"🌐 LAN:   https://{local_ip}:{port}")
if idle_timeout_sec > 0:
    print(f"🕒 Idle auto-stop: {idle_timeout_sec}s (set IDLE_TIMEOUT_SEC=0 to disable)")

threading.Thread(target=idle_shutdown_monitor, args=(httpd,), daemon=True).start()
httpd.serve_forever()
>>>>>>> 012e5fb (first commit)
