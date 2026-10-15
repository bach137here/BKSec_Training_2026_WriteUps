![[Pasted image 20261015225919.png]]

Thêm sự kiện:
![[Pasted image 20261015230248.png]]

Xóa sự kiện:
![[Pasted image 20261015230308.png]]

Các chức năng sorting:
![[Pasted image 20261015230335.png]]

![[Pasted image 20261015230348.png]]

Nếu thành công sẽ gửi một request success thế này:
![[Pasted image 20261015230431.png]]

Mình test chức năng sorting trước thì khi đổi sang key bất kì sẽ báo Error:
![[Pasted image 20261015230532.png]]
Mình dùng SQLMap kiểm tra xem có lỗ hỏng SQL injection ở đây không mà không được:
![[Pasted image 20261015231407.png]]



Mình test chức năng xóa, thấy một điều khá lạ là chuyển sang số 9 vẫn bị xóa event:
![[Pasted image 20261015231725.png]]

Chức năng add cho phép thêm event mà không cần cookie:
![[Pasted image 20261015232128.png]]