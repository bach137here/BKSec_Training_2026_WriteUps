
Đây thật sự là một challenge mà mình thích nhất trong đợt training :)) Không chỉ vì exploit chain hay giúp mình vận dụng được nhiều kĩ năng mà giao diện web cũng gợi mình khá nhiều liên tưởng😄

![[Attachments/Pasted image 20261118215845.png]]

# TL;DR

Mình giải challenge này bằng cách kết hợp nhiều lỗ hỏng khác nhau, mỗi lỗ hỏng lại mở ra nhiều điều thú vị để mình khám phá. Bắt đầu từ 
**Business Logic Flaws -> SQL injection -> Arbitrary file write/read -> Python Format String Vulnerability -> Remote Code Execution** 

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

Bạn có thể thấy, thật tuyệt vời khi chúng ta có thể làm một vài điều khá thù vị như kiểu truy cập attribute,  gọi các hàm str(), repr

