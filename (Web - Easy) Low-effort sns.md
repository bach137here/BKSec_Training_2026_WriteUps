where connections happen (sometimes) - powered by ai slop 😆

---
Tài liệu/Bài báo tham khảo:


---


![[Pasted image 20261013113232.png]]

Đầu tiên mình thử đăng kí một tài khoản, trong lúc đăng kí mình tự nhiên thấy một request chúc mừng đã đăng kí thành công với tin nhắn nó nằm ở Query 😁 Thế là mình thử inject một payload XSS thì đúng thật đây là lỗ hỏng XSS Reflected:

![[Pasted image 20261013113434.png]]

Thế là mình đã tìm được vector đầu tiên:D


![[Pasted image 20261013113459.png]]
Khi đăng nhập vào thì mình chỉ nhận được một thông báo thế này
Mình không tim thấy gì đặc biệt sau khi đăng nhập lắm nên mình thử dò một lúc bằng cách đăng nhập/ đăng kí với username admin:

Logic đăng nhập là khi người dùng nhập sai dù là tài khoản hay mật khẩu thì sẽ gửi một request về / với param error='invalid username or password'
![[Pasted image 20261013114257.png]]
Mình không thấy gì đặc biệt khi thay đổi param này và cảm giác như param này không được dùng để làm gì hết ý.

![[Pasted image 20261013114342.png]]
Mình thử đăng kí với username admin thì vẫn được.

Mình thử username emunarate nhẹ nhàng thì không thầy gì đặc biệt:
![[Pasted image 20261013121652.png]]

![[Pasted image 20261013121756.png]]

Khá stuck do không biết flag mình cần lấy ở chỗ nào... Mình không thấy dấu hiệu của admin bot hay gì nên cảm giác vector XSS nãy tìm được không có ích lắm.

Chạy gobuster thì cũng không thấy gì đặc biệt:
![[Pasted image 20261013122359.png]]
 Test thêm với wordlist rộng hơn thì mình tìm được endpoint db_init.php nhưng chẳng để làm gì😅 Thế là mình không đi theo hướng này nữa:
 ![[Pasted image 20261013152122.png]]


Mình quay sang test lại SQL injection (vì đây là con đường cuối cùng mình nghĩ ra 😞). Nãy mình có test qua SQL injection nhưng mình bị bias chỉ test ở mật khẩu, do mô tuyp chủ quan của mình, mấy bài SQL Injection dễ mình hay làm sẽ có dạng query kiểu:

```
SELECT * FROM users WHERE username=<input> and password=<input>  
```
Nên nãy mình chủ quan chỉ test của password và cho qua luôn.

Giờ test kĩ hơn, mình mới tìm được lỗ hỏng SQL injection ở uname 😆:
![[Pasted image 20261013152658.png]]

Có lẽ 'big technology' mà đề bài muốn nhắc đến ở đây có lẽ là một thuật toán hashing mật khẩu nảo đó, khi mật khẩu đã được hash thì dấu comment -- cũng sẽ biến mất theo dẫn đến SQLi thất bại:
```
SELECT * FROM users WHERE username=<input> and password=hashed(<input>)  
```

Giờ mình khai thác lỗ hỏng này tuần tự, do đề bài không cho thông tin gì về tài khoản admin hay gì đó nên chắc là mình sẽ phải tìm flag trong database:
1) Xác định số lượng cột trả về của query: Ở đây có 2 cách là dùng UNION SELECT null,null... và ORDER BY ...(Bạn có thể tìm hiểu trên PortSwigger). Nhưng có lẽ database đã định dạng các cột là not NULL nên mình không dùng trick thứ nhất được -> Mình dùng ORDER BY để xác định số cột:
![[Pasted image 20261013153403.png]]

![[Pasted image 20261013153419.png]]
=> Có tổng cộng 4 cột trả về.

Mình test một lúc thì nhận ra sức người khó mà đoán được kiểu dữ liệu từng cột, nên mình mày mò nhờ AI chỉ cách dùng tool SQLMap để automate:D :
```bash
python sqlmap.py -r req.txt --batch --dbs --random-agent \
  -p uname --technique=B \
  --string="home.php" \
  --force-ssl -v 3
```
![[Pasted image 20261013161202.png]]

```bash
python sqlmap.py -r req.txt --batch --tables --random-agent --force-ssl
```
![[Pasted image 20261013161130.png]]

```bash
python sqlmap.py -r req.txt --batch -T user_info --columns --random-agent --force-ssl
```

![[Pasted image 20261013161914.png]]

```bash
python sqlmap.py -r req.txt --batch --random-agent --force-ssl -T user_info --dump
```


