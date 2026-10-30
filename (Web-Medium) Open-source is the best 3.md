

---
Tài liệu/Bài báo tham khảo:
https://github.com/nehkark/CVE-2025-55182

---

![[Attachments/Pasted image 20261030223317.png]]


Trang web cho mình một ô nhập email:
![[Attachments/Pasted image 20261030223357.png]]

Mình nhập vào thì thấy Reflect về, một dữ kiện nhỏ cho mình:
![[Attachments/Pasted image 20261030223456.png]]


Nhưng cái mà mình thấy đáng chủ ý nhất là server không trả về các response dạng Json thông thường mà trả về một định dạng khá dị lần đầu mình thấy:
![[Attachments/Pasted image 20261030223641.png]]

Ngoài ra mình còn thấy dị hơn nữa là có khá nhiều header lạ mình không biết có ý nghĩa gì.

Đặc biệt là cái header này:
![[Attachments/Pasted image 20261030223746.png]]
Nó làm mình hình dung như kiểu một cái Object gì đó được serialize vậy? Mình thấy khá dị nên mình search Google và thấy một đống CVE nói về cái này :))

Lúc mình lướt đến PoC này trên github:
https://github.com/nehkark/CVE-2025-55182
Thì thấy uầy sao giống y bài mình đang làm luôn, thế là mình clone repo về chạy PoC như một script-kiddie thực thụ:


![[Attachments/Pasted image 20261030223951.png]]
Và mình thành công luôn :)) RCE:

![[Attachments/Pasted image 20261030224052.png]]
