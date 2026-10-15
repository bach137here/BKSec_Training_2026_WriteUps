

![[Pasted image 20261015115341.png]]

Thêm task mới chỉ đơn giản là gửi một POST request đến server với body bao gồm todo=`<input>`

![[Pasted image 20261015115605.png]]


XSS có thể trigger thành công:
![[Pasted image 20261015115708.png]]
![[Pasted image 20261015115720.png]]

Đây là thậm chí dạng stored XSS ứng với mỗi session của người dùng 😀


Server này là server python được xây dựng bằng Flask/Werkzeug
