
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


