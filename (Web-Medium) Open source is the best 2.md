

---
Tài liệu/Bài báo tham khảo:
https://strobes.co/blog/understanding-next-js-vulnerability/

---

![[Pasted image 20261017161655.png]]


Giao diện app:
![[Pasted image 20261017162012.png]]

Mình ấn vào /dashboard trang dẫn mình đến phần signin với /dashboard ở query string, có lẽ là để chuyển hướng sau khi đăng nhập:
![[Pasted image 20261017162044.png]]

Như lần trước thì mình view-source và kéo xuống bên dưới:
![[Pasted image 20261017162350.png]]

Ko có source map như lần trước nữa 😥

![[Pasted image 20261017163012.png]]

Mình thử nhập bất cứ giá trị nào vào form login thì đều trả về 303 sau đó được chuyển hướng đến `https://localhost:3000/login?error=1`
nghĩa là website này đăng nhập sau đó chuyển về local, nên chỉ local dùng được.

![[Pasted image 20261017163250.png]]
Mình xem kĩ request hơn thì mình để ý thấy website không sử dụng Referer policy và truyền cả URL vào Refferer. Nó không có gì lắm, chỉ là một điều khá đáng chủ ý.

Thế là mình thử nghịch nghịch bằng cách đổi Referer thành cái khác xem có gì ko:
![[Pasted image 20261017163522.png]]
![[Pasted image 20261017163710.png]]

Kết quả là vẫn vậy😑

Sau đó mình search trên mạng thì không hiểu sao lướt trúng một CVE giống y hệt bài tập đang làm :)) ảo thật: https://strobes.co/blog/understanding-next-js-vulnerability/

Mình chỉ đơn giản là thêm header  `X-Middleware-Subrequest: middleware:middleware:middleware:middleware:middleware` thì tự nhiên xem được tất cả dashboard:
![[Pasted image 20261017172003.png]]

![[Pasted image 20261017172010.png]]

Mình đọc chú thích bên dưới và thử với id=1 thì đọc được profile luôn :)) và lấy được flag:
![[Pasted image 20261017172213.png]]