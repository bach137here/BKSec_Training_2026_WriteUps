

---
Tài liệu/Bài báo tham khảo:
https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/SQLite%20Injection.md

---


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


Mình thử test tiếp bằng cách gửi một OPTIONS request đến /, mình thấy còn được gửi HEAD requests nữa.
![[Pasted image 20261016090011.png]]

![[Pasted image 20261016090015.png]]

Nhưng cũng chẳng để làm gì ;-;
Thế là mình quay sang dùng Param Miner trong Burp để quét thì phát hiện có 2 header lạ được ẩn đi:
![[Pasted image 20261018005252.png]]
Mình test mãi ko biết 2 header này để làm gì, quyết định quay về test SQL injection tiếp:

![[Pasted image 20261018011823.png]]

Mình tự nhiên thấy ko bị lỗi 500 khi chèn OR 1=1 ảo thật. Mình đoán nó có gì đó trong /sort rồi.

Yeah và đúng như mình dự đoán, chỗ này có vẻ server đã truyền thẳng:
```
... ORDER BY <key>
```
để làm tính năng sắp xếp theo tên cột.

Mình thử test xem đây là cơ sở dữ liệu gì bằng cách:
![[Pasted image 20261020000547.png]]

![[Pasted image 20261020000603.png]]

Anh em có thể thấy, nếu gửi hàm version() vào thì lỗi còn gửi sqlite_version() lại được -> chắc chắn đây là sqlite.

Mình thử test thêm:
1=1:
![[Pasted image 20261020000854.png]]

1=2:
![[Pasted image 20261020000906.png]]

hehehehe, anh em có thể thấy nếu 1=1 thì TRUE sẽ ở trên đầu, còn 1=2 thì FALSE sẽ ở trên đầu -> SQL injection dạng Boolean-based


