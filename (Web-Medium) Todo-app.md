

---
Tài liệu/Bài báo tham khảo:

SSTI cheat-sheet: https://github.com/l1ackersalman/Bug-Hunting-Cheatsheet/blob/main/SSTI.md
https://hacktricks.wiki/en/pentesting-web/ssti-server-side-template-injection/jinja2-ssti.html

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
`{{cycler|attr('\x5f\x5finit\x5f\x5f')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('o'+'s')|attr('po'+'pen')('i'+'d')|attr('read')()}}`



![[Pasted image 20261015180316.png]]

