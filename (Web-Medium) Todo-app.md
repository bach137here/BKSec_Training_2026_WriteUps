

![[Pasted image 20261015115341.png]]

Thêm task mới chỉ đơn giản là gửi một POST request đến server với body bao gồm todo=`<input>`

![[Pasted image 20261015115605.png]]


XSS có thể trigger thành công:
![[Pasted image 20261015115708.png]]
![[Pasted image 20261015115720.png]]

Đây là thậm chí dạng stored XSS ứng với mỗi session của người dùng 😀
Mình đã thử thêm một script fetch() xem có ip nào lạ xem được todo list của mình không nhưng không có🤔


Server này là server python được xây dựng bằng Flask/Werkzeug
![[Pasted image 20261015120659.png]]

cookie có dấu chấm ở đầu nên được nén bởi zlib:
.eJyrVirJT8kvVrKKVkosTszKTixW0lGyKU4uyiwosVNIzEktKtEw1FSw0YcKEZCNrQUATm4aqA.atBdLQ.FhfffmRHRAWqg95RZKRip8f1wmo

Mình thử giải nén ra xem có những gì:
![[Pasted image 20261015121038.png]]
