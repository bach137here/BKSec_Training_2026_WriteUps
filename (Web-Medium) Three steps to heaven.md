

---
Tài liệu/Bài báo tham khảo:


---

![Pasted image 20261025112448](Attachments/Pasted%20image%2020261025112448.png)

Nhìn vào giao diện của trang web mình quan sát thấy có 2 nút chuyển hướng là "Join us" và "Login", khi ấn vào thì luôn trỏ đến /?page=login.php

![[Attachments/Pasted image 20261028103624.png]]


Mình thử SQL injection thì thấy:
![[Attachments/Pasted image 20261028103719.png]]

Sau đó mình FUZZ một lúc thì cũng chẳng thấy gì đặc biệt. Mình nghĩ có thể là Error-based hay gì đó nhưng không thấy gì đặc biệt nên tạm thời đi theo hướng khác trước.


Như nãy mình có nhắc đến /?page=login.php á. Mình thấy cái này khá dị, chắc hẳn cách setup này có liên quan đến một lỗ hỏng nào đó nên mình thử đôi /?page=random, random.php xem:

![[Attachments/Pasted image 20261028104023.png]]

Hehe, màn hình hiện ra một thông báo lỗi. Mình thấy ngay đây là lỗ hỏng LFI.

Dựa vào một cái trick trên Hacktricks thì mình thành công leak được source code của app:
![[Attachments/Pasted image 20261028104407.png|423]]

