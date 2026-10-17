


![[Pasted image 20261017155229.png]]
Vẫn giống như challenge Happy sodier trước. Nhưng lần này mình đã khôn hơn và xem source đầu tiên :))

Lần này cookie đã được kí đàng hoàng:
![[Pasted image 20261017155409.png]]

Điều kiện thắng ở đây chắc chắn chỉ còn cách đọc được file /secret.txt và kí cookie. 
Và để làm vậy thì hướng khả thi nhất có lẽ là sử dụng lỗ hỏng Insecure Deserialization:

Mới đầu mình nghĩ cái gì phức tạp cơ nhưng không ngờ ở đây app lại so sánh 
`$this->sig == md5($secret . $this->weapon)` để kiểm tra cookie: