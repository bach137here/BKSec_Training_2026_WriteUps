

---
Tài liệu/Bài báo tham khảo:
https://hacktricks.wiki/en/pentesting-web/file-inclusion/index.html

---

![Pasted image 20261025112448](Attachments/Pasted%20image%2020261025112448.png)

Nhìn vào giao diện của trang web mình quan sát thấy có 2 nút chuyển hướng là "Join us" và "Login", khi ấn vào thì luôn trỏ đến /?page=login.php

![[Attachments/Pasted image 20261028103624.png]]


Mình thử SQL injection thì thấy:
![[Attachments/Pasted image 20261028103719.png]]

Sau đó mình FUZZ một lúc thì cũng chẳng thấy gì đặc biệt. Mình nghĩ có thể là Error-based hay gì đó nhưng không thấy gì đặc biệt nên tạm thời đi theo hướng khác trước.


Như nãy mình có nhắc đến /?page=login.php á. Mình thấy cái này khá dị, chắc hẳn cách setup này có liên quan đến một lỗ hỏng nào đó nên mình thử đôi /?page=random, random.php xem:

![[Attachments/Pasted image 20261028104023.png]]

Hehe, màn hình hiện ra một thông báo lỗi. Mình thấy ngay đây là lỗ hỏng LFI.

Dựa vào một cái trick trên Hacktricks thì mình thành công leak được source code của app:
![[Attachments/Pasted image 20261028104407.png|423]]

```
/?page=php://filter/convert.base64-encode/resource=index.php
```
![[Attachments/Pasted image 20261028104814.png]]


Decode ra thì ta đọc được source code của các endpoint như sau:
- Index.php:
```php
<?php
ob_start();
session_start(); // Start session before any HTML output

// only allow php files to be included
if (isset($_GET['page']) && strlen($_GET['page']) < 1000 && preg_match('/^.*\.ph(p|ps|tml)/', $_GET['page'])) {
    // prevent directory traversal
    $page = $_GET['page'];
    while (substr_count(urldecode($page), '../', 0)) {
        $page = str_replace('../', '', urldecode($page));
    };
} else {
    // default to home page
    $page = "home.php";
}
?>

...html here
```

- login.php:
```php
<?php
// redirect on direct access
if (__FILE__ === realpath($_SERVER['SCRIPT_FILENAME'])) {
    header('Location: index.php?page=login.php');
}

if (isset($_POST['username']) && isset($_POST['password'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];
    if (strpos($username, "'") !== false || strpos($username, '"') !== false ||
        strpos($password, "'") !== false || strpos($password, '"') !== false) {
        http_response_code(500);
        die("Database Error: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '" . htmlspecialchars($username) . "' at line 1");
    }
    $error = "Invalid credentials";
}

if (isset($_POST['vip_code']) && !empty($_POST['vip_code'])) {
    $code = $_POST['vip_code'];

    if (strpos($code, "'") !== false || strpos($code, '"') !== false) {
        http_response_code(500);
        die("Database Error: You have an error in your SQL syntax near '" . htmlspecialchars($code) . "'");
    }

    // require_once('apply.php');

    function validate_vip_code($code) {
        $pattern = '/^CYBER2026-[A-Z]{3}[0-9]{4}[!@#$%][A-Z]{2}_[0-9]{6}$/';
        return preg_match($pattern, $code) === 1;
    }

    if (validate_vip_code($code)) {
        $_SESSION["logged"] = true;
        echo '<script>window.location.href = "index.php?page=apply.php";</script>';
        exit();
    } else {
        $error = "Invalid VIP access code format";
    }
}
?>

... html here

```

- upload.php:
```php
<?php
session_start();

if (isset($_SESSION["logged"])) {
    $target_dir = "./user_submissions/";
    $fileName = basename($_FILES["uploadFile"]["name"]);
    $target_file = $target_dir . $fileName;

    if (strpos($fileName, '.php') !== false) {
        echo "Extension not allowed";
        die();
    }

    if (!preg_match('/^.*\.(jpg|jpeg|png|gif)$/', $fileName)) {
        echo "Only images are allowed";
        die();
    }

    if ($_FILES["uploadFile"]["size"] > 500000) {
        echo "File too large";
        die();
    }

    if (move_uploaded_file($_FILES["uploadFile"]["tmp_name"], $target_file)) {
        echo "File successfully uploaded";
    } else {
        echo "File failed to upload";
    }
} else {
    echo "Only logged in users can upload files";
}

```

Oke, nhìn vào đây ta thấy ngay cái thông báo Database lỗi kia là cú lừa thế kỉ :)) App thậm chí còn không có database và validate người dùng cực kì sơ sài bằng Regex:
```php
    function validate_vip_code($code) {
        $pattern = '/^CYBER2026-[A-Z]{3}[0-9]{4}[!@#$%][A-Z]{2}_[0-9]{6}$/';
        return preg_match($pattern, $code) === 1;
    }

    if (validate_vip_code($code)) {
        $_SESSION["logged"] = true;
        echo '<script>window.location.href = "index.php?page=apply.php";</script>';
        exit();
    } else {
        $error = "Invalid VIP access code format";
    }
}
```
Nhìn vào Regex kia thì mình dễ dàng tạo được một Vip Code cho riêng mình:
`CYBER2026-ABC1307!OK_999999`
và thành công đăng nhập được:


Khi đăng nhập thành công thì có một trang Apply với chức năng Upload avatar:
![[Attachments/Pasted image 20261028105911.png]]
![[Attachments/Pasted image 20261028110349.png]]


Nhìn vào source code ta có thể thấy server validate file được upload lên như sau:
```php
$target_dir = "./user_submissions/";
    $fileName = basename($_FILES["uploadFile"]["name"]);
    $target_file = $target_dir . $fileName;

    if (strpos($fileName, '.php') !== false) {
        echo "Extension not allowed";
        die();
    }

    if (!preg_match('/^.*\.(jpg|jpeg|png|gif)$/', $fileName)) {
        echo "Only images are allowed";
        die();
    }
```
- File được upload vào thư mục ./user_submissions
- File không được có đuôi .php
- Dùng regex và kiểm tra xem tên file có `.<extension ảnh>` trong đó không

Đến đây thì mình thử áp dụng một số cái trick như kiểu thêm Null Byte:
- abc.php%00.png
Có nhiều extension:
- abc.php.png 
Mình cũng thử Fuzz các fileName dạng:
- `abc.php<FUZZ>.png`
- `abc.php<FUZZ>abc.png`

Nhưng đều không được. Thế là mình nghĩ đến việc upload file .htaccess để có thể chỉnh cấu hình server cho phép coi một đuôi file ảnh có thể execute:

```htaccess
AddType application/x-httpd-php .png
```

Nhưng cái khó ở đây là mặc dù server không cấm .htaccess nhưng server yêu cầu đuôi file phải là ảnh bằng regex. Dẫn đến việc upload cực khó.
![[Attachments/Pasted image 20261028111714.png]]

Mình nhập filename là .htaccess%00.png thì được, nhưng sau đó mình không xem được file .htaccess của server:
![[Attachments/Pasted image 20261028111929.png]]
Mình cũng đã thử đọc .htaccess bằng LFI nhưng có điều server chỉ cho đọc file .php nên không được.

Nhưng mình vẫn thử upload file payload.png với nội dung
`<?php system('id') ?>`

Nhưng server vẫn chỉ coi đó là file ảnh và không execute được:
![[Attachments/Pasted image 20261028112355.png]]
![[Attachments/Pasted image 20261028112440.png]]

Chứng tỏ .htaccess của mình chưa được upload thành công ?

Thế là mình quyết định chuyển sang hướng đi khác, lúc này mình mới nhớ lại nãy mình có bắt gặp LFI, không biết mình có thể kết hợp nó với File upload để làm điều gì đó không?

![[Attachments/Pasted image 20261028112900.png]]