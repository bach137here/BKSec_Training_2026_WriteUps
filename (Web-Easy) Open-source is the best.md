
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

Mình tìm kiếm các endpoint, từ khóa ở trong source này mà không thấy gì đặc biệt. Tạm thời mình xem cái khác trước.

![[Pasted image 20261015215531.png]]
Wow, mình có thể đọc hết các file trong /app hehe.
![[Pasted image 20261015215656.png]]
![[Pasted image 20261015220028.png|652]]

![[Pasted image 20261015220250.png]]



Mình vượt qua kiểm duyệt và đọc được flag thành công:D
![[Pasted image 20261015220719.png]]
