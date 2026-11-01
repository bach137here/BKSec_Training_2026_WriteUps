

---
Tài liệu/Bài báo tham khảo:
https://github.com/nehkark/CVE-2025-55182

---

![Pasted image 20261030223317](Attachments/Pasted%20image%2020261030223317.png)


Trang web cho mình một ô nhập email:
![Pasted image 20261030223357](Attachments/Pasted%20image%2020261030223357.png)

Mình nhập vào thì thấy Reflect về, một dữ kiện nhỏ cho mình:
![Pasted image 20261030223456](Attachments/Pasted%20image%2020261030223456.png)


Nhưng cái mà mình thấy đáng chủ ý nhất là server không trả về các response dạng Json thông thường mà trả về một định dạng khá dị lần đầu mình thấy:
![Pasted image 20261030223641](Attachments/Pasted%20image%2020261030223641.png)

Ngoài ra mình còn thấy dị hơn nữa là có khá nhiều header lạ mình không biết có ý nghĩa gì.

Đặc biệt là cái header này:
![Pasted image 20261030223746](Attachments/Pasted%20image%2020261030223746.png)
Nó làm mình hình dung như kiểu một cái Object gì đó được serialize vậy? Mình thấy khá dị nên mình search Google và thấy một đống CVE nói về cái này :))

Lúc mình lướt đến PoC này trên github:
https://github.com/nehkark/CVE-2025-55182
Thì thấy uầy sao giống y bài mình đang làm luôn, thế là mình clone repo về chạy PoC như một script-kiddie thực thụ:


![Pasted image 20261030223951](Attachments/Pasted%20image%2020261030223951.png)

Và mình thành công luôn :)) RCE:
![Pasted image 20261030224052](Attachments/Pasted%20image%2020261030224052.png)

Link PoC mình dùng ở đây: https://raw.githubusercontent.com/nehkark/CVE-2025-55182/refs/heads/main/poc-cve-2025-55182.py

Mình có đọc qua PoC thì thấy khá phức tạp, mình chỉ hiểu được 1 phần thôi :(

1) Thêm header "Next-Action": "x" vào POST request gửi đến server.
2) File gửi lên sẽ gồm 2 phần:
 ![Pasted image 20261030225905](Attachments/Pasted%20image%2020261030225905.png)

Phần 1: Lấy Object 0
Phần 0: Chữa crafted chunk

3) Trong crafted chunk thì định nghĩa các thuộc tính:
![Pasted image 20261030230204](Attachments/Pasted%20image%2020261030230204.png)

Mình chỉ hiểu được sơ sơ vài cái ;-; (nhờ AI)
- Định nghĩa 'then' để lừa Javascript coi Object sau khi deserialize là một Promise.
- Sau đó ghi đè getter của `_formData` thành constructor của nó: Function()
- Từ đó thực thi mã độc trong `_prefix` đã bị ghi đè. Bởi khi React xử lý chunk nó sẽ gọi `_formData.get(_prefix)`
- Ném kết quả sau khi thực thi RCE vào một cái lỗi rồi lọc ra output trả về.