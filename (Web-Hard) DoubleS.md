
Đây thật sự là một challenge mà mình thích nhất trong đợt training :)) Không chỉ vì exploit chain hay giúp mình vận dụng được nhiều kĩ năng mà giao diện web cũng gợi mình khá nhiều liên tưởng😄

![[Attachments/Pasted image 20261118215845.png]]

# TL;DR

Mình giải challenge này bằng cách kết hợp nhiều lỗ hỏng khác nhau, mỗi lỗ hỏng lại mở ra nhiều điều thú vị để mình khám phá. Bắt đầu từ 
**Business Logic Flaws -> SQL injection -> Arbitrary file write/read -> Python Format String Vulnerability -> Remote Code Execution** 

# 1. Reconnaissance!!

Mình thử spawn Instance mà recon qua thì dường như challenge chỉ có một chức năng duy nhất là đăng nhập:
Nếu đăng nhập sai thì sẽ trả về 'Invalid Credentials':
![[Attachments/Pasted image 20261118222452.png]]

Nếu có kí tự lạ thì sẽ trả về thông báo cấm:
![[Attachments/Pasted image 20261118222649.png]]

Mình xem đến source code:
Đầu tiên là **Dockerfile**, mình thấy các setup thông thường, flag được để ở /root/flag.txt, quyền 400 nên chỉ root được đọc:
![[Attachments/Pasted image 20261118222917.png]]

Chuyển sang **start.sh**:
![[Attachments/Pasted image 20261118224117.png]]

Logic của app được thể hiện trong **app.py**:
![[Attachments/2026-11-18_22-46.png]]


Ta thấy sự xuất hiện của class SQLQueryBuilder và InputValidator trong hàm authenticate:
![[Attachments/Pasted image 20261118231027.png]]


Hàm InputValidate lưu cặp placeholder và giá trị tương ứng cùng với logic kiểm tra xem có thỏa mãn các yêu cầu bảo mật không, đáng chú ý là một lúc sau mình mới để ý có một typo nho nhỏ ở danh sách các kí tự cấm 😋
![[Attachments/Pasted image 20261118231634.png]]

Đến với SQLQueryBuilder, đây mới là phần thú vị nhất:
![[Attachments/Pasted image 20261118231844.png]]

Điểm thú vị nằm ở vòng lặp While:
![[Attachments/Pasted image 20261118232041.png]]

Logic nhìn qua có thể thấy khá bình thường. Nhưng đọc kĩ chúng ta có thể thấy một điều rất bất thường.
Bình thường nếu một dev bình thường muốn code để thay thế từ:

```
"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
```

thành

```
"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
```