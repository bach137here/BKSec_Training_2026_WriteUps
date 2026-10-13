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
Mình không tim thấy gì đặc biệt sau khi đăng nhập lắm nên mình thử dò một lúc bằng cách đăng nhập/ đăng kí với username admin:

Logic đăng nhập là khi người dùng nhập sai dù là tài khoản hay mật khẩu thì sẽ gửi một request về / với param error='invalid username or password'
![[Pasted image 20261013114257.png]]
Mình không thấy gì đặc biệt khi thay đổi param này và cảm giác như param này không được dùng để làm gì hết ý.

![[Pasted image 20261013114342.png]]
Mình thử đăng kí với username admin thì vẫn được.

Mình thử username emunarate nhẹ nhàng thì không thầy gì đặc biệt:
![[Pasted image 20261013121652.png]]

![[Pasted image 20261013121756.png]]

Khá stuck do không biết flag mình cần lấy ở chỗ nào... Mình không thấy dấu hiệu của admin bot hay gì nên cảm giác vector XSS nãy tìm được không có ích lắm.

Chạy gobuster thì cũng không thấy gì đặc biệt:
![[Pasted image 20261013122359.png]]
 Test thêm với wordlist rộng hơn thì mình tìm được endpoint db_init.php nhưng chẳng để làm gì😅 Thế là mình không đi theo hướng này nữa:
 ![[Pasted image 20261013152122.png]]


Mình quay sang test lại SQL injection (vì đây là con đuon)