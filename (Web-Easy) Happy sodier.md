

---
Tài liệu/Bài báo tham khảo:
https://portswigger.net/web-security/deserialization

---
![[Pasted image 20261013175414.png]]

Mình không thích bài này lắm 😗 Bài này mình phải AI slop do quá kẹt huhu

App được viết bằng PHP server Apache

APP chỉ có một chức năng duy nhất là đánh quái sau đó được cộng tiền. Trạng thái của người chơi được lưu trong một cookie đã được serialized dạng base64:
```
Tzo2OiJQbGF5ZXIiOjQ6e3M6NjoiaGVhbHRoIjtpOjEwMDtzOjY6ImF0dGFjayI7aToxMDtzOjU6ImNvaW5zIjtpOjA7czo2OiJ3ZWFwb24iO3M6MTI6Ildvb2RlbiBTd29yZCI7fQ%3D%3D
```
Decode ra ta được: 
```
O:6:"Player":4:{s:6:"health";i:100;s:6:"attack";i:10;s:5:"coins";i:0;s:6:"weapon";s:12:"Wooden Sword";}%3D%3D
```
Yeah đến đây mình thử đổi giá trị cookie thành cái khác, đóng gói và gửi thì server chấp nhận luôn do cookie này hoàn toàn không được kí:
![[Pasted image 20261017153246.png]]

Vấn đề là mình không biết đâu là điều kiện thắng, mình recon thêm các lỗ hỏng như SSTI, SQL injection nhưng không thấy gì.
Sau đó mình hướng tới một lỗ hỏng là Insecure Deserialization, các bạn tìm hiểu thêm ở: https://portswigger.net/web-security/deserialization/exploiting
Nhưng vấn đề là mình không có một chút thông tin nào về source code hay là lỗi gì được trả về từ server (để biết được thư viện/framework rồi chọn exploit chain trong phpggc cho phù hợp)

Và dù mình recon thế nào cũng không có tí tiến triển gì, manh mối nhỏ nhất mà mình thấy là trong CSS có vài hiệu ứng hay biểu diễn một vài biểu tượng chiến thắng, ngoài ra có một cái sus nhất là .source-link:
![[Pasted image 20261017153850.png]]

Nhưng không có bất kì tag nào có id như vậy cả.
Đến lúc này mình nghĩ đến đi quét directory, nhưng không thể nào tìm thấy thêm một chút xíu manh mối nào nữa.

Mình có hỏi BTC nhưng bài này không lỗi và anh bảo mình recon kĩ hơn... Nhưng mình hết cách rồi :))) sau khi mình slop cực căng thì mới tìm ra đáp án đó chính là phải brute-force parameter, ảo thật đấy ????


![[Pasted image 20261017152847.png]]

Xem source thì thậm chí mình ko cần làm gì hết, có luôn điều kiện thắng và dễ dàng lấy flag:
![[Pasted image 20261017154332.png]]

Mình craft ra một cái cookie và dễ dàng lấy được flag:
![[Pasted image 20261017154748.png]]

![[Pasted image 20261017154818.png]]
