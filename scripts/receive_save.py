"""مستقبل محلي لاستلام PDF المعدّل من المتصفح (E2E فقط)"""
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = "/home/z/my-project/scripts/t_out/e2e/edited_result.pdf"


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n)
        with open(OUT, "wb") as f:
            f.write(body)
        print(f"SAVED {len(body)} bytes", flush=True)
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, *a):
        pass


HTTPServer(("127.0.0.1", 3999), H).serve_forever()
