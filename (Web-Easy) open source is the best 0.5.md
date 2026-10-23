



![[Pasted image 20261020171945.png]]
Website chỉ bao gồm 1 file static.
![[Pasted image 20261023105525.png]]

Mình đọc response thì server dùng Apache 2.4.50, mình còn để ý thấy Last-Modified là 2007 nên mình khá nghi rằng mình sẽ phải khai thác lỗ hỏng ở phiên bản cũ này.

Mình lên mạng thử một số PoC:...
![[Pasted image 20261020171934.png]]


Đến khi thử https://github.com/CalfCrusher/Path-traversal-RCE-Apache-2.4.49-2.4.50-Exploit thì thành công:

![[Pasted image 20261023105758.png]]


Thế là mình copy payload và chạy RCE:

