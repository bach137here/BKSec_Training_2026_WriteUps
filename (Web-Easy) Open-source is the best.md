
![[Pasted image 20261015212806.png]]

![[Pasted image 20261015212813.png]]

Mình check source của challenge thì thấy có import một script /@vite/client
![[Pasted image 20261015213015.png]]

Kéo xuống dưới thì mình thấy một comment khá khả nghi:
![[Pasted image 20261015213112.png]]

Decode đoạn base64 thì mình thu được:
![[Pasted image 20261015213438.png]]


Chỉnh sửa một chút thì mình được source content như sau:
![[Pasted image 20261015214141.png]]

Mình tìm kiếm các endpoint, từ khóa ở trong source client này mà không thấy gì đặc biệt. Tạm thời mình xem cái khác trước.

Mình để ý thấy đây là dev server của vite:
![[Pasted image 20261015221348.png]]

Mình thấy có một CVE cho vite dev server:
![[Pasted image 20261015221534.png]]
Khá liên quan đến mô tả của challenge "Open Source" :D và đọc file:
![[Pasted image 20261015221644.png]]

Chưa thêm ?raw??:
![[Pasted image 20261015221734.png]]

Thêm theo CVE:
![[Pasted image 20261015220719.png]]

Ý của flag là nên update version mới thường xuyên kaka, do lỗ hỏng này xuất hiện ở các version cũ:
![[Pasted image 20261015221927.png]]