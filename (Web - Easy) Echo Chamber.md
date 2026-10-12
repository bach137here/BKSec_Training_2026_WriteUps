![[Pasted image 20261012221259.png]]

Challenge khá thú vị khi cho chúng ta một chức năng để Echo tất cả những gì ta nhập ra Client-side.

![[Pasted image 20261012221429.png]]

Có thể thấy, website đang sử dụng CSP:

```CSP
default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: *;
```

![[Pasted image 20261012222613.png]]

Ngoài chính trang web thì 