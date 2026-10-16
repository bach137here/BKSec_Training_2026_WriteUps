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


Mình tính test thêm SSTI ở chức năng add, trong lúc cho SSTI chạy thì mình để ý thấy một cái khá hay, là khi mình đổi status thành khác thì các event bị mất đi:
![[Pasted image 20261015233908.png]]
![[Pasted image 20261015233920.png]]

Điều này giúp mình đặt ra nghi vấn có lẽ nào Param này liên quan tới một query SQL? -> Mình test thêm SQL injection ở đây. (Update lúc sau: Ko được)

Trong lúc test SQLi thì mình tự nhiên nảy ra ý tưởng đổi body thành dạng json rồi tìm xem có phương án tấn công kiểu như Prototype Pollution được không nhưng không được:
![[Pasted image 20261015234948.png]]

Nhưng multipart thì vẫn nhận:
![[Pasted image 20261015235116.png]]Mình thử upload file vào nhưng không được gì, nên bỏ qua hướng này.

Mình thử decode cookie xem có gì không mà không thấy gì đặc biệt:
![[Pasted image 20261016082949.png]]

