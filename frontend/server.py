import http.server
import ssl
import os
import base64
import json
import shutil

port = 8050
cert_file = './aserver.local+3.pem'
key_file = './aserver.local+3-key.pem'

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class MyHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):

        # ================= 이미지 저장 =================
        if self.path == '/save-image':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))

            img_data = data['image'].split(',')[1]
            filename = data['filename']

            os.makedirs('captures', exist_ok=True)

            with open(f"captures/{filename}", "wb") as f:
                f.write(base64.b64decode(img_data))

            self.send_response(200)
            self.end_headers()

        # ================= 설정 저장 =================
        elif self.path == '/save-settings':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))

            with open("settings.json", "w") as f:
                json.dump(data, f)

            self.send_response(200)
            self.end_headers()

        # ================= 이미지 삭제 =================
        elif self.path == '/delete-image':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))

            fpath = f"captures/{data['filename']}"

            if os.path.exists(fpath):
                os.remove(fpath)

            self.send_response(200)
            self.end_headers()

        # ================= 전체 삭제 =================
        elif self.path == '/delete-all':
            if os.path.exists('captures'):
                shutil.rmtree('captures')

            os.makedirs('captures')

            self.send_response(200)
            self.end_headers()

    def do_GET(self):

        # ================= 이미지 목록 =================
        if self.path == '/get-images':
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

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(images).encode())

        # ================= 설정 불러오기 =================
        elif self.path == '/get-settings':

            if os.path.exists("settings.json"):
                with open("settings.json", "r") as f:
                    data = json.load(f)
            else:
                data = {}

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())


httpd = http.server.HTTPServer(('', port), MyHandler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

try:
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
except FileNotFoundError:
    print("❌ 인증서 없음")
    exit(1)

httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"🚀 https://aserver.local:{port}")
httpd.serve_forever()