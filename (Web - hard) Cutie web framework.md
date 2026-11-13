![[Attachments/Pasted image 20261113214634.png]]	

API đề cho được xây dựng bằng framework ElysiaJS khá cute :D
Mình có vào website để tìm hiểu để hiểu vài syntax lạ:
![[Attachments/Pasted image 20261102210041.png]]

![[Attachments/Pasted image 20261113215345.png]]

Đọc source code mình thấy có adminPlugin và authPlugin với logic:

![[Attachments/Pasted image 20261113215552.png]]

![[Attachments/Pasted image 20261113215631.png]]


![[Attachments/Pasted image 20261113220100.png]]

Khi mà đăng nhập được với tư cách admin thì sẽ đọc được secret qua /secrets.

Ở đây có một điểm đáng chú ý tại:
```python
const adminPlugin = new Elysia({ prefix: '/admin' })

```
prefix ở đây nghĩa là mọi endpoint được định nghĩa phía sau luôn phải thêm /admin vào.

Ví dụ mình muốn truy cập /auth/login thì sẽ phải vào /admin/auth/login.

Đọc thêm thì mình thấy nghi ngay lỗ hỏng SQL Injection qua unsafe:
![[Attachments/Pasted image 20261113220542.png]]

Ứng dụng SELECT 2 trường username và role từ users. Mình hoàn toàn có thể chèn payload query tùy ý qua orderBy.

https://elysiajs.com/plugins/graphql-yoga
Mình thử query qua đây endpoint /graphql:

![[Attachments/Pasted image 20261113222644.png]]


![[Attachments/Pasted image 20261113223059.png]]


Lúc này mình thử chèn payload lấy mật khẩu:
