where connections happen (sometimes) - powered by ai slop 😆

---
Tài liệu/Bài báo tham khảo:


---


![[Pasted image 20261013113232.png]]

Đầu tiên mình thử đăng kí một tài khoản, trong lúc đăng kí mình tự nhiên thấy một request chúc mừng đã đăng kí thành công với tin nhắn nó nằm ở Query 😁 Thế là mình thử inject một payload XSS thì đúng thật đây là lỗ hỏng XSS Reflected:

![[Pasted image 20261013113434.png]]

Thế là mình đã tìm được vector đầu tiên:D


![[Pasted image 20261013113459.png]]
Khi đăng nhập vào thì mình chỉ nhận được một thông báo thế này